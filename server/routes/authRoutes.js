const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

const DISCORD_API = "https://discord.com/api/v10";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SESSION_COOKIE_NAME = "syxth.sid";

const MOBILE_AUTH_TOKEN_SECRET =
  process.env.MOBILE_AUTH_TOKEN_SECRET ||
  process.env.SESSION_SECRET ||
  "change-this-secret";

const MOBILE_AUTH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(value) {
  let normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (normalized.length % 4) {
    normalized += "=";
  }

  return Buffer.from(normalized, "base64").toString("utf8");
}

function signValue(value) {
  return base64UrlEncode(
    crypto
      .createHmac("sha256", MOBILE_AUTH_TOKEN_SECRET)
      .update(value)
      .digest()
  );
}

function signMobileAuthToken(user = {}) {
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    user,
    iat: now,
    exp: now + MOBILE_AUTH_TOKEN_MAX_AGE_SECONDS,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function verifyMobileAuthToken(token) {
  try {
    if (!token || typeof token !== "string") return null;

    const [encodedPayload, signature] = token.split(".");

    if (!encodedPayload || !signature) return null;

    const expectedSignature = signValue(encodedPayload);

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (signatureBuffer.length !== expectedBuffer.length) {
      return null;
    }

    const validSignature = crypto.timingSafeEqual(
      signatureBuffer,
      expectedBuffer
    );

    if (!validSignature) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (!payload?.user?.id) return null;
    if (!payload?.exp || payload.exp < now) return null;

    return payload.user;
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const authorization = req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getAuthenticatedUser(req) {
  const sessionUser = req.session?.user || null;

  if (sessionUser?.id) {
    return sessionUser;
  }

  const token = getBearerToken(req);
  const tokenUser = verifyMobileAuthToken(token);

  if (tokenUser?.id) {
    return tokenUser;
  }

  return null;
}

function getDiscordAvatarUrl(user = {}) {
  if (!user.id || !user.avatar) return null;

  const extension = user.avatar.startsWith("a_") ? "gif" : "png";

  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}?size=128`;
}

function sanitizeDiscordUser(user = {}) {
  return {
    id: user.id,
    username: user.username,
    globalName: user.global_name || user.globalName || null,
    avatar: user.avatar || null,
    avatarUrl: getDiscordAvatarUrl(user),
  };
}

function clearSessionCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  });
}

router.get("/discord", (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({
      ok: false,
      error: "Discord OAuth environment variables are missing.",
    });
  }

  const state = crypto.randomBytes(24).toString("hex");
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify",
    state,
    prompt: "consent",
  });

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        error: "Failed to save OAuth session.",
      });
    }

    return res.redirect(
      `https://discord.com/oauth2/authorize?${params.toString()}`
    );
  });
});

router.get("/discord/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.status(400).json({
        ok: false,
        error: "Missing Discord authorization code.",
      });
    }

    if (!state || state !== req.session.oauthState) {
      return res.status(403).json({
        ok: false,
        error: "Invalid OAuth state.",
      });
    }

    delete req.session.oauthState;

    const tokenParams = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await axios.post(
      `${DISCORD_API}/oauth2/token`,
      tokenParams.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const userResponse = await axios.get(`${DISCORD_API}/users/@me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const discordUser = sanitizeDiscordUser(userResponse.data);

    req.session.user = discordUser;

    const mobileAuthToken = signMobileAuthToken(discordUser);

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          error: "Failed to save login session.",
        });
      }

      return res.redirect(
        `${CLIENT_URL}/dashboard?login=success&token=${encodeURIComponent(
          mobileAuthToken
        )}`
      );
    });
  } catch (error) {
    console.error("Discord OAuth error:", error.response?.data || error.message);

    return res.status(500).json({
      ok: false,
      error: "Discord login failed.",
    });
  }
});

router.get("/me", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  const user = getAuthenticatedUser(req);

  return res.json({
    ok: true,
    authenticated: Boolean(user?.id),
    loggedIn: Boolean(user?.id),
    user,
  });
});

router.post("/logout", (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (!req.session) {
    clearSessionCookie(res);

    return res.json({
      ok: true,
      authenticated: false,
      loggedIn: false,
      user: null,
      message: "Logged out.",
    });
  }

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        ok: false,
        error: "Failed to logout.",
      });
    }

    clearSessionCookie(res);

    return res.json({
      ok: true,
      authenticated: false,
      loggedIn: false,
      user: null,
      message: "Logged out.",
    });
  });
});

router.verifyMobileAuthToken = verifyMobileAuthToken;
router.getAuthenticatedUser = getAuthenticatedUser;

module.exports = router;