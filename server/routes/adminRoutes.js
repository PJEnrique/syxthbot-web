const express = require("express");
const { db } = require("../firebase/firebase");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { normalizePlayer } = require("../game/syxthGameUtils");

const router = express.Router();

function getDisplayName(user = {}) {
  return (
    user.globalName ||
    user.global_name ||
    user.displayName ||
    user.username ||
    "Discord User"
  );
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return number;
}

function getPlayerName(player = {}, fallback = "Unknown Player") {
  return (
    player.username ||
    player.displayName ||
    player.globalName ||
    player.name ||
    player.discordUsername ||
    fallback
  );
}

function getPlayerClass(player = {}) {
  return (
    player.classId ||
    player.class ||
    player.job ||
    player.role ||
    "unknown"
  );
}

function getPlayerPetCount(player = {}) {
  if (Array.isArray(player.pets)) {
    return player.pets.length;
  }

  if (player.pets && typeof player.pets === "object") {
    return Object.keys(player.pets).length;
  }

  return safeNumber(player.petCount, 0);
}

function getInventoryCount(player = {}) {
  const inventory = player.inventory || player.items || player.backpack;

  if (Array.isArray(inventory)) {
    return inventory.length;
  }

  if (inventory && typeof inventory === "object") {
    return Object.keys(inventory).length;
  }

  return 0;
}

function normalizeAdminPlayer(doc) {
  const raw = doc.data() || {};

  let normalized = null;

  try {
    normalized = normalizePlayer(raw, {
      id: doc.id,
      username:
        raw.username ||
        raw.displayName ||
        raw.name ||
        raw.discordUsername ||
        "Unknown Player",
    });
  } catch (error) {
    normalized = raw;
  }

  const player = normalized || raw;

  return {
    id: doc.id,

    username: getPlayerName(player, getPlayerName(raw)),
    classId: getPlayerClass(player),

    level: safeNumber(player.level || raw.level, 1),
    exp: safeNumber(player.exp || raw.exp, 0),
    gold: safeNumber(player.gold || raw.gold, 0),

    power: safeNumber(player.power || raw.power, 0),
    overallScore: safeNumber(
      player.overallScore ||
        player.score ||
        raw.overallScore ||
        raw.score ||
        player.power ||
        raw.power,
      0
    ),

    attack: safeNumber(player.attack || raw.attack, 0),
    defense: safeNumber(player.defense || raw.defense, 0),
    maxHp: safeNumber(player.maxHp || raw.maxHp || raw.hp, 0),
    currentHp: safeNumber(player.currentHp || raw.currentHp || raw.hp, 0),
    dodge: safeNumber(player.dodge || raw.dodge, 0),
    crit: safeNumber(player.crit || raw.crit, 0),

    monsterKills: safeNumber(
      player.monsterKills || raw.monsterKills || raw.kills,
      0
    ),

    bossDamage: safeNumber(
      player.bossDamage ||
        player.totalBossDamage ||
        raw.bossDamage ||
        raw.totalBossDamage,
      0
    ),

    petCount: getPlayerPetCount(player),
    inventoryCount: getInventoryCount(player),

    activePet:
      player.activePet?.name ||
      raw.activePet?.name ||
      raw.activePetId ||
      "",

    world: player.world || raw.world || raw.currentWorld || "unknown",

    createdAt:
      raw.createdAt?.toDate?.()?.toISOString?.() ||
      raw.createdAt ||
      null,

    updatedAt:
      raw.updatedAt?.toDate?.()?.toISOString?.() ||
      raw.updatedAt ||
      null,
  };
}

async function getCollectionSize(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.size;
}

async function getTradeCounts() {
  const snapshot = await db.collection("tradeListings").get();

  let activeTradesCount = 0;
  let totalTradesCount = 0;

  snapshot.forEach((doc) => {
    totalTradesCount += 1;

    const trade = doc.data() || {};

    if (trade.status === "active") {
      activeTradesCount += 1;
    }
  });

  return {
    totalTradesCount,
    activeTradesCount,
  };
}

async function getPlayerStats() {
  const snapshot = await db.collection("players").get();

  const players = snapshot.docs.map(normalizeAdminPlayer);

  const totalGold = players.reduce(
    (sum, player) => sum + safeNumber(player.gold, 0),
    0
  );

  const totalKills = players.reduce(
    (sum, player) => sum + safeNumber(player.monsterKills, 0),
    0
  );

  const totalPets = players.reduce(
    (sum, player) => sum + safeNumber(player.petCount, 0),
    0
  );

  const averageLevel = players.length
    ? players.reduce((sum, player) => sum + safeNumber(player.level, 1), 0) /
      players.length
    : 0;

  const topPowerPlayer = [...players].sort(
    (a, b) => safeNumber(b.power, 0) - safeNumber(a.power, 0)
  )[0];

  const richestPlayer = [...players].sort(
    (a, b) => safeNumber(b.gold, 0) - safeNumber(a.gold, 0)
  )[0];

  const topKiller = [...players].sort(
    (a, b) => safeNumber(b.monsterKills, 0) - safeNumber(a.monsterKills, 0)
  )[0];

  return {
    players,
    stats: {
      playersCount: players.length,
      totalGold,
      totalKills,
      totalPets,
      averageLevel: Number(averageLevel.toFixed(2)),
      topPowerPlayer: topPowerPlayer || null,
      richestPlayer: richestPlayer || null,
      topKiller: topKiller || null,
    },
  };
}

router.get("/me", requireAuth, requireAdmin, (req, res) => {
  return res.json({
    ok: true,
    admin: {
      id: req.session.user.id,
      username: req.session.user.username || "",
      displayName: getDisplayName(req.session.user),
      avatarUrl: req.session.user.avatarUrl || "",
    },
  });
});

router.get("/overview", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [{ stats }, tradeCounts, worldBossesCount] = await Promise.all([
      getPlayerStats(),
      getTradeCounts(),
      getCollectionSize("worldBosses").catch(() => 0),
    ]);

    return res.json({
      ok: true,
      overview: {
        playersCount: stats.playersCount,

        totalGold: stats.totalGold,
        totalKills: stats.totalKills,
        totalPets: stats.totalPets,
        averageLevel: stats.averageLevel,

        tradeListingsCount: tradeCounts.totalTradesCount,
        activeTradesCount: tradeCounts.activeTradesCount,

        worldBossesCount,

        topPowerPlayer: stats.topPowerPlayer,
        richestPlayer: stats.richestPlayer,
        topKiller: stats.topKiller,

        mode: "read_only",
      },
    });
  } catch (error) {
    console.error("Failed to load admin overview:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load admin overview.",
    });
  }
});

router.get("/recent-players", requireAuth, requireAdmin, async (req, res) => {
  try {
    const snapshot = await db.collection("players").get();

    const players = snapshot.docs
      .map(normalizeAdminPlayer)
      .sort((a, b) => {
        const updatedA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const updatedB = new Date(b.updatedAt || b.createdAt || 0).getTime();

        if (updatedA !== updatedB) {
          return updatedB - updatedA;
        }

        return safeNumber(b.level, 1) - safeNumber(a.level, 1);
      })
      .slice(0, 20);

    return res.json({
      ok: true,
      players,
    });
  } catch (error) {
    console.error("Failed to load recent players:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load recent players.",
    });
  }
});

router.get("/top-players", requireAuth, requireAdmin, async (req, res) => {
  try {
    const type = String(req.query.type || "power").toLowerCase();
    const snapshot = await db.collection("players").get();

    const sortFieldMap = {
      power: "power",
      level: "level",
      gold: "gold",
      kills: "monsterKills",
      pets: "petCount",
      boss: "bossDamage",
      overall: "overallScore",
    };

    const sortField = sortFieldMap[type] || "power";

    const players = snapshot.docs
      .map(normalizeAdminPlayer)
      .sort((a, b) => safeNumber(b[sortField], 0) - safeNumber(a[sortField], 0))
      .slice(0, 20);

    return res.json({
      ok: true,
      type,
      sortField,
      players,
    });
  } catch (error) {
    console.error("Failed to load top players:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load top players.",
    });
  }
});

module.exports = router;