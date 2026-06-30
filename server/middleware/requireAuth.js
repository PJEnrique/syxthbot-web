const authRoutes = require("../routes/authRoutes");

function requireAuth(req, res, next) {
  const user = authRoutes.getAuthenticatedUser(req);

  if (!user?.id) {
    return res.status(401).json({
      ok: false,
      error: "Not logged in.",
    });
  }

  req.user = user;

  // Keep old route code working during the mobile token fallback.
  // Some routes still read req.session.user, so we mirror the resolved user
  // into the current request session object.
  if (req.session) {
    req.session.user = user;
  }

  return next();
}

module.exports = requireAuth;
