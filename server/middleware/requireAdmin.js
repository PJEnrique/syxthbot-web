const axios = require("axios");
const authRoutes = require("../routes/authRoutes");

const DISCORD_API = "https://discord.com/api/v10";

function getAllowedRoleIds() {
  const raw = process.env.ADMIN_ROLE_IDS || process.env.ADMIN_ROLE_ID || "";

  return raw
    .split(",")
    .map((roleId) => roleId.trim())
    .filter(Boolean);
}

function maskToken(token = "") {
  if (!token) return "";
  return `${token.slice(0, 8)}...${token.slice(-6)}`;
}

async function getGuildMember({ guildId, userId, botToken }) {
  const response = await axios.get(
    `${DISCORD_API}/guilds/${guildId}/members/${userId}`,
    {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    }
  );

  return response.data;
}

async function requireAdmin(req, res, next) {
  try {
    const user = req.user || authRoutes.getAuthenticatedUser(req);
    const userId = user?.id;

    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: "You must be logged in.",
      });
    }

    req.user = user;

    if (req.session) {
      req.session.user = user;
    }

    const guildId = process.env.DISCORD_GUILD_ID;
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const allowedRoleIds = getAllowedRoleIds();

    if (!guildId) {
      return res.status(500).json({
        ok: false,
        error: "DISCORD_GUILD_ID is missing from the server environment.",
      });
    }

    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: "DISCORD_BOT_TOKEN is missing from the server environment.",
      });
    }

    if (!allowedRoleIds.length) {
      return res.status(500).json({
        ok: false,
        error: "ADMIN_ROLE_ID or ADMIN_ROLE_IDS is missing from the server environment.",
      });
    }

    const member = await getGuildMember({
      guildId,
      userId,
      botToken,
    });

    const memberRoleIds = Array.isArray(member.roles) ? member.roles : [];

    const matchedRoleIds = memberRoleIds.filter((roleId) =>
      allowedRoleIds.includes(roleId)
    );

    const hasRequiredRole = matchedRoleIds.length > 0;

    if (!hasRequiredRole) {
      return res.status(403).json({
        ok: false,
        error: "You do not have the required Discord role to access the game panel.",
      });
    }

    req.adminAccess = {
      authorizedBy: "discord_role",
      guildId,
      userId,
      allowedRoleIds,
      matchedRoleIds,
    };

    return next();
  } catch (error) {
    const status = error.response?.status;

    if (status === 404) {
      return res.status(403).json({
        ok: false,
        error: "You are not a member of the configured Discord server.",
      });
    }

    if (status === 401 || status === 403) {
      console.error("Discord bot authorization failed:", {
        status,
        botToken: maskToken(process.env.DISCORD_BOT_TOKEN),
      });

      return res.status(500).json({
        ok: false,
        error: "Discord bot token is invalid or cannot check guild members.",
      });
    }

    console.error("Admin role check failed:", error.response?.data || error.message);

    return res.status(500).json({
      ok: false,
      error: "Failed to verify Discord admin role.",
    });
  }
}

module.exports = requireAdmin;
