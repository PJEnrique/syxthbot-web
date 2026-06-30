const express = require("express");
const { db } = require("../firebase/firebase");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { normalizePlayer } = require("../game/syxthGameUtils");

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

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function toIsoDate(value) {
  if (!value) return null;

  if (typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
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

function normalizeInventoryList(player = {}) {
  const inventory = player.inventory || player.items || player.backpack || [];

  if (Array.isArray(inventory)) {
    return inventory.map((item, index) => ({
      key: item.instanceId || item.inventoryId || item.id || `item_${index}`,
      id: item.id || item.baseItemId || "",
      name: item.name || item.itemName || "Unknown Item",
      emoji: item.emoji || item.itemEmoji || "📦",
      quality: item.quality || item.itemQuality || "Common",
      type: item.type || item.itemType || "Unknown",
      quantity: safeNumber(item.quantity, 1),
      requiredLevel: safeNumber(item.requiredLevel, 1),
      price: safeNumber(item.price, 0),
      equipped: Boolean(item.equipped || item.isEquipped),
      locked: Boolean(item.locked || item.isLocked),
      tradeLocked: Boolean(item.tradeLocked),
      listedTradeId: item.listedTradeId || "",
      description: item.description || "",
      stats: item.stats || {},
    }));
  }

  if (inventory && typeof inventory === "object") {
    return Object.entries(inventory).map(([key, item = {}]) => ({
      key,
      id: item.id || item.baseItemId || "",
      name: item.name || item.itemName || "Unknown Item",
      emoji: item.emoji || item.itemEmoji || "📦",
      quality: item.quality || item.itemQuality || "Common",
      type: item.type || item.itemType || "Unknown",
      quantity: safeNumber(item.quantity, 1),
      requiredLevel: safeNumber(item.requiredLevel, 1),
      price: safeNumber(item.price, 0),
      equipped: Boolean(item.equipped || item.isEquipped),
      locked: Boolean(item.locked || item.isLocked),
      tradeLocked: Boolean(item.tradeLocked),
      listedTradeId: item.listedTradeId || "",
      description: item.description || "",
      stats: item.stats || {},
    }));
  }

  return [];
}

function normalizePetsList(player = {}) {
  const pets = player.pets || [];

  if (Array.isArray(pets)) {
    return pets.map((pet, index) => ({
      key: pet.id || pet.basePetId || `pet_${index}`,
      id: pet.id || "",
      basePetId: pet.basePetId || pet.petId || "",
      name: pet.name || "Unknown Pet",
      emoji: pet.emoji || "🐾",
      type: pet.type || "balanced",
      quality: pet.quality || "Common",
      level: safeNumber(pet.level, 1),
      exp: safeNumber(pet.exp, 0),
      active: Boolean(pet.active),
      locked: Boolean(pet.locked),
      stats: pet.stats || {},
    }));
  }

  if (pets && typeof pets === "object") {
    return Object.entries(pets).map(([key, pet = {}]) => ({
      key,
      id: pet.id || key,
      basePetId: pet.basePetId || pet.petId || "",
      name: pet.name || "Unknown Pet",
      emoji: pet.emoji || "🐾",
      type: pet.type || "balanced",
      quality: pet.quality || "Common",
      level: safeNumber(pet.level, 1),
      exp: safeNumber(pet.exp, 0),
      active: Boolean(pet.active),
      locked: Boolean(pet.locked),
      stats: pet.stats || {},
    }));
  }

  return [];
}

function normalizeEquipment(player = {}) {
  const equipment = player.equipment || player.equipped || {};
  const slots = ["weapon", "helmet", "armor", "gloves", "pants", "boots"];

  return slots.reduce((result, slot) => {
    const item = equipment?.[slot] || null;

    result[slot] = item
      ? {
          id: item.id || item.baseItemId || "",
          name: item.name || "Unknown Item",
          emoji: item.emoji || "📦",
          quality: item.quality || "Common",
          type: item.type || slot,
          requiredLevel: safeNumber(item.requiredLevel, 1),
          description: item.description || "",
          stats: item.stats || {},
        }
      : null;

    return result;
  }, {});
}

function normalizeAdminPlayer(doc) {
  const raw = doc.data() || {};

  let normalized = null;

  try {
    normalized = normalizePlayer(raw, {
      id: raw.userId || doc.id,
      username:
        raw.username ||
        raw.displayName ||
        raw.name ||
        raw.discordUsername ||
        "Unknown Player",
      avatarUrl: raw.avatarUrl || null,
    });
  } catch (error) {
    normalized = raw;
  }

  const player = normalized || raw;

  return {
    id: doc.id,
    userId: player.userId || raw.userId || doc.id,

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

    world: player.worldName || player.world || raw.worldName || raw.world || raw.currentWorld || "unknown",

    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
  };
}

function normalizeAdminPlayerDetails(doc) {
  const raw = doc.data() || {};
  const summary = normalizeAdminPlayer(doc);

  let normalized = null;

  try {
    normalized = normalizePlayer(raw, {
      id: raw.userId || doc.id,
      username:
        raw.username ||
        raw.displayName ||
        raw.name ||
        raw.discordUsername ||
        "Unknown Player",
      avatarUrl: raw.avatarUrl || null,
    });
  } catch (error) {
    normalized = raw;
  }

  const player = normalized || raw;

  return {
    ...summary,

    avatarUrl: player.avatarUrl || raw.avatarUrl || null,
    rank: player.rank || raw.rank || "",
    className: player.className || raw.className || summary.classId,
    classEmoji: player.classEmoji || raw.classEmoji || "",
    worldId: player.worldId || raw.worldId || raw.world?.id || "",
    worldName: player.worldName || raw.worldName || raw.world?.name || summary.world,

    hp: safeNumber(player.hp || raw.hp || raw.currentHp, 0),
    maxHp: safeNumber(player.maxHp || raw.maxHp, 0),
    exp: safeNumber(player.exp || raw.exp, 0),
    requiredExp: player.requiredExp || null,
    expPercent: safeNumber(player.expPercent, 0),
    hpPercent: safeNumber(player.hpPercent, 0),

    baseStats: player.baseStats || {},
    equipmentStats: player.equipmentStats || {},
    totalStats: player.totalStats || {},

    equipment: normalizeEquipment(player),
    inventory: normalizeInventoryList(raw),
    pets: normalizePetsList(raw),

    inventoryCount: normalizeInventoryList(raw).length,
    petCount: normalizePetsList(raw).length,

    activePet: player.activePet || raw.activePet || null,
    activePetId: player.activePetId || raw.activePetId || null,
    activePetStats: player.activePetStats || null,

    bossKills: safeNumber(player.bossKills || raw.bossKills, 0),
    totalBossDamage: safeNumber(
      player.totalBossDamage || raw.totalBossDamage || raw.bossDamage,
      0
    ),
    retreats: safeNumber(player.retreats || raw.retreats, 0),

    privateChannelId: raw.privateChannelId || null,

    reviveStatus: player.reviveStatus || null,

    createdAt: toIsoDate(raw.createdAt),
    updatedAt: toIsoDate(raw.updatedAt),
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

router.use(noStore);

router.get("/me", requireAuth, requireAdmin, (req, res) => {
  const user = req.user;

  return res.json({
    ok: true,
    admin: {
      id: user.id,
      username: user.username || "",
      displayName: getDisplayName(user),
      avatarUrl: user.avatarUrl || "",
      access: req.adminAccess || null,
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
        accessMode: "discord_role",
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

router.get("/players/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const playerId = normalizeText(req.params.id);

    if (!playerId) {
      return res.status(400).json({
        ok: false,
        error: "Player ID is required.",
      });
    }

    const playerDoc = await db.collection("players").doc(playerId).get();

    if (!playerDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: "Player not found.",
      });
    }

    return res.json({
      ok: true,
      player: normalizeAdminPlayerDetails(playerDoc),
    });
  } catch (error) {
    console.error("Failed to inspect player:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to inspect player.",
    });
  }
});

module.exports = router;