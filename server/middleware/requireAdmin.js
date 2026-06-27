function getAdminIds() {
  return String(process.env.ADMIN_DISCORD_IDS || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function requireAdmin(req, res, next) {
  const userId = req.session?.user?.id;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      error: "Not logged in.",
    });
  }

  const adminIds = getAdminIds();

  if (!adminIds.includes(userId)) {
    return res.status(403).json({
      ok: false,
      error: "Admin access required.",
    });
  }

  next();
}

module.exports = requireAdmin;