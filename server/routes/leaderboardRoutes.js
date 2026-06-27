const express = require("express");
const { db } = require("../firebase/firebase");

const {
  normalizePlayer,
  safeNumber,
} = require("../game/syxthGameUtils");

const router = express.Router();

const VALID_TYPES = [
  "overall",
  "power",
  "level",
  "gold",
  "kills",
  "pets",
  "boss",
];

function getScore(player, type) {
  if (type === "power") return safeNumber(player.power);
  if (type === "level") return safeNumber(player.level);
  if (type === "gold") return safeNumber(player.gold);
  if (type === "kills") return safeNumber(player.monsterKills);
  if (type === "pets") return safeNumber(player.petsOwned);
  if (type === "boss") return safeNumber(player.totalBossDamage);

  return safeNumber(player.overallScore);
}

function getScoreLabel(type) {
  const labels = {
    overall: "Overall",
    power: "Power",
    level: "Level",
    gold: "Gold",
    kills: "Monster Kills",
    pets: "Pets Owned",
    boss: "Boss Damage",
  };

  return labels[type] || labels.overall;
}

async function leaderboardHandler(req, res) {
  try {
    const type = String(req.params.type || "overall").toLowerCase();
    const leaderboardType = VALID_TYPES.includes(type) ? type : "overall";

    const limit = Math.min(
      100,
      Math.max(5, Number(req.query.limit || 50))
    );

    const snapshot = await db.collection("players").get();

    const players = snapshot.docs
      .map((doc) => normalizePlayer(doc.data()))
      .map((player) => ({
        ...player,
        score: getScore(player, leaderboardType),
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.level !== a.level) return b.level - a.level;
        return b.power - a.power;
      })
      .slice(0, limit)
      .map((player, index) => ({
        rank: index + 1,
        userId: player.userId,
        username: player.username,
        avatarUrl: player.avatarUrl,
        worldId: player.worldId,
        worldName: player.worldName,
        classId: player.classId,
        className: player.className,
        classEmoji: player.classEmoji,
        level: player.level,
        rankTitle: player.rank,
        power: player.power,
        overallScore: player.overallScore,
        gold: player.gold,
        monsterKills: player.monsterKills,
        petsOwned: player.petsOwned,
        totalBossDamage: player.totalBossDamage,
        score: player.score,
      }));

    return res.json({
      ok: true,
      type: leaderboardType,
      scoreLabel: getScoreLabel(leaderboardType),
      players,
    });
  } catch (error) {
    console.error("Leaderboard error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load leaderboard.",
    });
  }
}

router.get("/", leaderboardHandler);
router.get("/:type", leaderboardHandler);

module.exports = router;