const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { db } = require("../firebase/firebase");

const { normalizePlayer } = require("../game/syxthGameUtils");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;

    const playerDoc = await db.collection("players").doc(userId).get();

    if (!playerDoc.exists) {
      return res.status(404).json({
        ok: false,
        error:
          "No SYXTH player found for this Discord account. Use !s start in Discord first.",
        user,
      });
    }

    const player = normalizePlayer(playerDoc.data(), user);

    return res.json({
      ok: true,
      player,
    });
  } catch (error) {
    console.error("Load player error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load player data.",
    });
  }
});

module.exports = router;
