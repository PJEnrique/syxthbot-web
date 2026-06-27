const express = require("express");
const { db } = require("../firebase/firebase");

const {
  WORLDS,
  BOSS_SCHEDULE,
  BOSSES,
  normalizeBoss,
} = require("../game/syxthGameUtils");

const router = express.Router();

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

router.get("/status", async (req, res) => {
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

      bosses.push({
        worldId: world.id,
        worldName: world.name,
        active:
          String(rawBoss.status || "").toLowerCase() === "active" &&
          Number(rawBoss.hp || 0) > 0,
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