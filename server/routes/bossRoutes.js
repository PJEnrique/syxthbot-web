const express = require("express");
const { db } = require("../firebase/firebase");

const {
  WORLDS,
  BOSS_SCHEDULE,
  BOSSES,
  normalizeBoss,
} = require("../game/syxthGameUtils");

const router = express.Router();

function noStore(req, res, next) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}

async function getBossRanking(worldId, limit = 10) {
  const snapshot = await db
    .collection("worldBosses")
    .doc(worldId)
    .collection("damage")
    .orderBy("damage", "desc")
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

router.get("/status", noStore, async (req, res) => {
  try {
    const requestedWorldId = req.query.worldId
      ? String(req.query.worldId)
      : null;

    const worlds = requestedWorldId
      ? WORLDS.filter((world) => world.id === requestedWorldId)
      : WORLDS;

    const bosses = [];

    for (const world of worlds) {
      const bossDoc = await db.collection("worldBosses").doc(world.id).get();

      if (!bossDoc.exists) {
        bosses.push({
          worldId: world.id,
          worldName: world.name,
          active: false,
          boss: null,
          ranking: [],
        });

        continue;
      }

      const rawBoss = {
        id: bossDoc.id,
        ...bossDoc.data(),
      };

      const ranking = await getBossRanking(world.id);

      const isActive =
        String(rawBoss.status || "").toLowerCase() === "active" &&
        Number(rawBoss.hp || 0) > 0;

      bosses.push({
        worldId: world.id,
        worldName: world.name,
        active: isActive,
        boss: normalizeBoss(rawBoss, ranking),
        ranking,
      });
    }

    return res.json({
      ok: true,
      schedule: BOSS_SCHEDULE,
      bossConfig: BOSSES,
      worlds: WORLDS,
      bosses,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Boss status error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load boss status.",
    });
  }
});

module.exports = router;