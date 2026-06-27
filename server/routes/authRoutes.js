const express = require("express");
const axios = require("axios");
const crypto = require("crypto");

const router = express.Router();

const DISCORD_API = "https://discord.com/api/v10";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SESSION_COOKIE_NAME = "syxth.sid";

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
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
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

    req.session.user = sanitizeDiscordUser(userResponse.data);

    req.session.save((err) => {
      if (err) {
        return res.status(500).json({
          ok: false,
          error: "Failed to save login session.",
        });
      }

      return res.redirect(`${CLIENT_URL}/dashboard`);
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

  const user = req.session?.user || null;

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

module.exports = router;