const EQUIPMENT_SLOTS = ["weapon", "helmet", "armor", "gloves", "pants", "boots"];

const MAX_LEVEL = 99;

const WORLDS = [
  {
    id: "world_1",
    name: "Syxth Server 1",
    description: "Dawn of a dragon world",
  },
  {
    id: "world_2",
    name: "Syxth Server 2",
    description: "Dark and dangerous world",
  },
  {
    id: "world_3",
    name: "Syxth Server 3",
    description: "High-risk adventure world",
  },
];

const CLASSES = [
  {
    id: "swordsman",
    name: "Swordsman",
    emoji: "⚔️",
    description: "Balanced melee fighter",
    baseStats: {
      maxHp: 130,
      attack: 15,
      defense: 9,
      dodge: 4,
      crit: 6,
    },
    growth: {
      maxHp: 13,
      attack: 2.8,
      defense: 1.9,
      dodge: 0.035,
      crit: 0.045,
    },
  },
  {
    id: "archer",
    name: "Archer",
    emoji: "🏹",
    description: "High crit ranged attacker",
    baseStats: {
      maxHp: 95,
      attack: 18,
      defense: 5,
      dodge: 6,
      crit: 8,
    },
    growth: {
      maxHp: 10,
      attack: 3.0,
      defense: 1.1,
      dodge: 0.045,
      crit: 0.065,
    },
  },
  {
    id: "assassin",
    name: "Assassin",
    emoji: "🗡️",
    description: "Fast class with high dodge and crit",
    baseStats: {
      maxHp: 85,
      attack: 20,
      defense: 4,
      dodge: 8,
      crit: 10,
    },
    growth: {
      maxHp: 8,
      attack: 3.2,
      defense: 0.85,
      dodge: 0.055,
      crit: 0.08,
    },
  },
  {
    id: "tanker",
    name: "Tanker",
    emoji: "🛡️",
    description: "High HP and defense class",
    baseStats: {
      maxHp: 155,
      attack: 10,
      defense: 14,
      dodge: 2,
      crit: 3,
    },
    growth: {
      maxHp: 14,
      attack: 2.1,
      defense: 2.5,
      dodge: 0.015,
      crit: 0.02,
    },
  },
];

const PET_EMOJIS = {
  baby_wolf: "<:baby_wolf:1511976609597362296>",
  stone_turtle: "<:stone_turtle:1511976633186386010>",
  forest_sprite: "<:forest_sprite:1511976666988154990>",
  young_hawk: "<:young_hawk:1511976792267948074>",
  moon_rabbit: "<:moon_rabbit:1511976820625379329>",
  wild_boar: "<:wild_boar:1511976907590209656>",

  shadow_wolf: "<:shadow_wolf:1511977606155731025>",
  spirit_deer: "<:spirit_deer:1511977583095582720>",
  ironback_turtle: "<:ironback_turtle:1511977559229730896>",
  mystic_owl: "<:mystic_owl:1511977529630658690>",
  night_panther: "<:night_panther:1511977408423657513>",

  ember_drake: "<:ember_drake:1511978242939293826>",
  golden_lion: "<:golden_lion:1511978223729381376>",
  phoenix_chick: "<:phoenix_chick:1511978110159945768>",
  ancient_dragonling: "<:ancient_dragonling:1511977640821657630>",
};

const PET_DATA = [
  {
    id: "baby_wolf",
    name: "Baby Wolf",
    type: "attack",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 600,
    requiredLevel: 5,
    baseStats: { attack: 4, defense: 0, maxHp: 12, dodge: 0.2, crit: 0.8 },
  },
  {
    id: "stone_turtle",
    name: "Stone Turtle",
    type: "tank",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 650,
    requiredLevel: 5,
    baseStats: { attack: 0, defense: 4, maxHp: 28, dodge: 0, crit: 0 },
  },
  {
    id: "forest_sprite",
    name: "Forest Sprite",
    type: "support",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 550,
    requiredLevel: 5,
    baseStats: { attack: 1, defense: 1, maxHp: 20, dodge: 0.4, crit: 0.2 },
  },
  {
    id: "young_hawk",
    name: "Young Hawk",
    type: "critical",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 700,
    requiredLevel: 8,
    baseStats: { attack: 3, defense: 0, maxHp: 10, dodge: 0.3, crit: 1.2 },
  },
  {
    id: "moon_rabbit",
    name: "Moon Rabbit",
    type: "evasion",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 700,
    requiredLevel: 8,
    baseStats: { attack: 1, defense: 0, maxHp: 16, dodge: 1.0, crit: 0.3 },
  },
  {
    id: "wild_boar",
    name: "Wild Boar",
    type: "balanced",
    dropGroup: "monster",
    allowedQualities: ["Common"],
    basePrice: 800,
    requiredLevel: 10,
    baseStats: { attack: 3, defense: 2, maxHp: 20, dodge: 0.2, crit: 0.4 },
  },

  {
    id: "shadow_wolf",
    name: "Shadow Wolf",
    type: "attack",
    dropGroup: "boss",
    allowedQualities: ["Rare"],
    basePrice: 1800,
    requiredLevel: 20,
    baseStats: { attack: 8, defense: 1, maxHp: 28, dodge: 0.6, crit: 1.8 },
  },
  {
    id: "spirit_deer",
    name: "Spirit Deer",
    type: "support",
    dropGroup: "boss",
    allowedQualities: ["Rare"],
    basePrice: 1800,
    requiredLevel: 20,
    baseStats: { attack: 2, defense: 3, maxHp: 55, dodge: 1.0, crit: 0.5 },
  },
  {
    id: "ironback_turtle",
    name: "Ironback Turtle",
    type: "tank",
    dropGroup: "boss",
    allowedQualities: ["Rare"],
    basePrice: 2000,
    requiredLevel: 20,
    baseStats: { attack: 1, defense: 8, maxHp: 70, dodge: 0, crit: 0.2 },
  },
  {
    id: "mystic_owl",
    name: "Mystic Owl",
    type: "critical",
    dropGroup: "boss",
    allowedQualities: ["Rare"],
    basePrice: 2200,
    requiredLevel: 25,
    baseStats: { attack: 5, defense: 1, maxHp: 30, dodge: 1.0, crit: 2.5 },
  },
  {
    id: "night_panther",
    name: "Night Panther",
    type: "evasion",
    dropGroup: "boss",
    allowedQualities: ["Rare"],
    basePrice: 2300,
    requiredLevel: 25,
    baseStats: { attack: 6, defense: 1, maxHp: 35, dodge: 1.8, crit: 1.2 },
  },

  {
    id: "ember_drake",
    name: "Ember Drake",
    type: "attack",
    dropGroup: "boss",
    allowedQualities: ["Legendary"],
    basePrice: 5000,
    requiredLevel: 40,
    baseStats: { attack: 14, defense: 4, maxHp: 75, dodge: 1.2, crit: 3.2 },
  },
  {
    id: "golden_lion",
    name: "Golden Lion",
    type: "balanced",
    dropGroup: "boss",
    allowedQualities: ["Legendary"],
    basePrice: 5200,
    requiredLevel: 40,
    baseStats: { attack: 10, defense: 8, maxHp: 95, dodge: 1.0, crit: 2.0 },
  },
  {
    id: "phoenix_chick",
    name: "Phoenix Chick",
    type: "support",
    dropGroup: "boss",
    allowedQualities: ["Legendary"],
    basePrice: 5500,
    requiredLevel: 45,
    baseStats: { attack: 5, defense: 5, maxHp: 130, dodge: 1.2, crit: 2.5 },
  },
  {
    id: "ancient_dragonling",
    name: "Ancient Dragonling",
    type: "tank",
    dropGroup: "boss",
    allowedQualities: ["Legendary"],
    basePrice: 6000,
    requiredLevel: 50,
    baseStats: { attack: 8, defense: 14, maxHp: 140, dodge: 0.8, crit: 1.5 },
  },
];

const BOSS_SCHEDULE = [
  { time: "12:00", tier: "beginner" },
  { time: "18:00", tier: "intermediate" },
  { time: "21:00", tier: "advanced" },
];

const BOSSES = {
  beginner: [
    {
      id: "goblin_king",
      name: "Goblin King",
      level: 10,
      recommendedLevel: { min: 5, max: 20 },
      rewards: { gold: 450, exp: 300 },
    },
    {
      id: "slime_emperor",
      name: "Slime Emperor",
      level: 15,
      recommendedLevel: { min: 8, max: 22 },
      rewards: { gold: 650, exp: 450 },
    },
  ],
  intermediate: [
    {
      id: "orc_commander",
      name: "Orc Commander",
      level: 35,
      recommendedLevel: { min: 25, max: 45 },
      rewards: { gold: 1500, exp: 900 },
    },
  ],
  advanced: [
    {
      id: "chaos_titan",
      name: "Chaos Titan",
      level: 80,
      recommendedLevel: { min: 70, max: 90 },
      rewards: { gold: 4500, exp: 2800 },
    },
  ],
};

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function safeText(value, fallback = "Unknown") {
  if (value === null || value === undefined) return fallback;

  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    return value.name || value.id || value.title || value.label || fallback;
  }

  return fallback;
}

function normalizeId(value) {
  return String(value || "").toLowerCase().trim();
}

function getClassConfig(classId = "swordsman") {
  const normalized = normalizeId(classId || "swordsman");
  return CLASSES.find((cls) => cls.id === normalized) || CLASSES[0];
}

function getWorldConfig(worldId) {
  const normalized = String(worldId || "").trim();
  return WORLDS.find((world) => world.id === normalized) || null;
}

function getRequiredExp(level) {
  const lv = Math.max(1, safeNumber(level, 1));

  if (lv >= MAX_LEVEL) return null;

  if (lv <= 10) {
    return Math.floor(45 + lv * 32 + lv * lv * 7);
  }

  if (lv <= 30) {
    return Math.floor(280 + lv * 65 + lv * lv * 15);
  }

  if (lv <= 60) {
    return Math.floor(900 + lv * 115 + lv * lv * 25);
  }

  if (lv <= 90) {
    return Math.floor(2000 + lv * 175 + lv * lv * 40);
  }

  return Math.floor(5500 + lv * 260 + lv * lv * 52);
}

function getLevelStatGain(classId = "swordsman", level = 1) {
  const config = getClassConfig(classId);
  const growth = config.growth;
  const lv = safeNumber(level, 1);

  let stageMultiplier = 1;

  if (lv > 80) {
    stageMultiplier = 1.15;
  } else if (lv > 50) {
    stageMultiplier = 1.08;
  } else if (lv > 20) {
    stageMultiplier = 1.03;
  }

  return {
    maxHp: Math.floor(safeNumber(growth.maxHp) * stageMultiplier),
    attack: safeNumber((safeNumber(growth.attack) * stageMultiplier).toFixed(2)),
    defense: safeNumber((safeNumber(growth.defense) * stageMultiplier).toFixed(2)),
    dodge: safeNumber(safeNumber(growth.dodge).toFixed(3)),
    crit: safeNumber(safeNumber(growth.crit).toFixed(3)),
  };
}

function getBaseStatsByClassLevel(classId = "swordsman", level = 1) {
  const targetLevel = Math.max(1, Math.min(MAX_LEVEL, safeNumber(level, 1)));
  const config = getClassConfig(classId);
  const base = config.baseStats;

  let attack = safeNumber(base.attack, 10);
  let defense = safeNumber(base.defense, 5);
  let maxHp = safeNumber(base.maxHp, 100);
  let dodge = safeNumber(base.dodge, 0);
  let crit = safeNumber(base.crit, 0);

  for (let currentLevel = 2; currentLevel <= targetLevel; currentLevel++) {
    const gain = getLevelStatGain(classId, currentLevel);

    attack += safeNumber(gain.attack);
    defense += safeNumber(gain.defense);
    maxHp += safeNumber(gain.maxHp);
    dodge += safeNumber(gain.dodge);
    crit += safeNumber(gain.crit);
  }

  return {
    attack: Math.floor(attack),
    defense: Math.floor(defense),
    maxHp: Math.floor(maxHp),
    dodge: safeNumber(dodge.toFixed(2)),
    crit: safeNumber(crit.toFixed(2)),
  };
}

function normalizeStats(stats = {}) {
  return {
    attack: safeNumber(stats.attack),
    defense: safeNumber(stats.defense),
    maxHp: safeNumber(stats.maxHp),
    dodge: safeNumber(stats.dodge),
    crit: safeNumber(stats.crit),
  };
}

function calculateEquipmentStats(baseStats = {}, equipment = {}) {
  const base = {
    attack: safeNumber(baseStats.attack, 10),
    defense: safeNumber(baseStats.defense, 5),
    maxHp: safeNumber(baseStats.maxHp, 100),
    dodge: safeNumber(baseStats.dodge),
    crit: safeNumber(baseStats.crit),
  };

  const total = { ...base };

  for (const slot of EQUIPMENT_SLOTS) {
    const item = equipment?.[slot];

    if (!item?.stats) continue;

    const stats = normalizeStats(item.stats);

    total.attack += stats.attack;
    total.defense += stats.defense;
    total.maxHp += stats.maxHp;
    total.dodge += stats.dodge;
    total.crit += stats.crit;
  }

  return {
    attack: Math.floor(Math.max(1, total.attack)),
    defense: Math.floor(Math.max(0, total.defense)),
    maxHp: Math.floor(Math.max(1, total.maxHp)),
    dodge: safeNumber(Math.min(50, Math.max(0, total.dodge)).toFixed(2)),
    crit: safeNumber(Math.min(65, Math.max(0, total.crit)).toFixed(2)),
  };
}

function getPetEmojiKey(pet = {}) {
  const candidate = normalizeId(pet.basePetId || pet.petId || pet.id);

  if (PET_EMOJIS[candidate]) return candidate;

  return Object.keys(PET_EMOJIS)
    .sort((a, b) => b.length - a.length)
    .find((key) => candidate === key || candidate.startsWith(`${key}_`));
}

function getPetDisplayEmoji(pet = {}) {
  const key = getPetEmojiKey(pet);
  return PET_EMOJIS[key] || pet.emoji || "🐾";
}

function getQualityEmoji(quality = "Common") {
  const qualityMap = {
    Starter: "🌱",
    Common: "🟢",
    Rare: "🔵",
    Legendary: "🟠",
  };

  return qualityMap[quality] || "🟢";
}

function normalizePet(pet = {}) {
  if (!pet) return null;

  const quality = ["Common", "Rare", "Legendary"].includes(pet.quality)
    ? pet.quality
    : "Common";

  const basePetId = pet.basePetId || getPetEmojiKey(pet) || pet.id;

  return {
    ...pet,
    id: safeText(pet.id, "unknown_pet"),
    basePetId,
    name: safeText(pet.name, "Unknown Pet"),
    emoji: getPetDisplayEmoji({ ...pet, basePetId }),
    type: safeText(pet.type, "balanced"),
    quality,
    qualityEmoji: pet.qualityEmoji || getQualityEmoji(quality),
    level: Math.max(1, safeNumber(pet.level, 1)),
    exp: Math.max(0, safeNumber(pet.exp)),
    locked: pet.locked === true,
    active: pet.active === true,
    stats: normalizeStats(pet.stats || {}),
    price: Math.max(0, Math.floor(safeNumber(pet.price))),
    source: safeText(pet.source, "unknown"),
  };
}

function normalizePets(pets = []) {
  return Array.isArray(pets) ? pets.map(normalizePet).filter(Boolean) : [];
}

function getPetMaxLevel(pet = {}) {
  const quality = pet.quality || "Common";

  const caps = {
    Common: 20,
    Rare: 30,
    Legendary: 40,
  };

  return caps[quality] || 20;
}

function getPetRequiredExp(level = 1) {
  const lv = Math.max(1, safeNumber(level, 1));
  return Math.floor(60 + lv * 35 + lv * lv * 8);
}

function getPetExpDisplay(pet = {}) {
  const normalized = normalizePet(pet);

  if (!normalized) return "0/0";

  const maxLevel = getPetMaxLevel(normalized);

  if (normalized.level >= maxLevel) {
    return `${normalized.exp}/MAX`;
  }

  return `${normalized.exp}/${getPetRequiredExp(normalized.level)}`;
}

function calculatePetStats(pet = {}) {
  const normalized = normalizePet(pet);

  if (!normalized) {
    return {
      attack: 0,
      defense: 0,
      maxHp: 0,
      dodge: 0,
      crit: 0,
    };
  }

  const level = Math.min(normalized.level, getPetMaxLevel(normalized));
  const stats = normalized.stats || {};

  return {
    attack: Math.floor(safeNumber(stats.attack) + level * 0.25),
    defense: Math.floor(safeNumber(stats.defense) + level * 0.2),
    maxHp: Math.floor(safeNumber(stats.maxHp) + level * 2),
    dodge: safeNumber((safeNumber(stats.dodge) + level * 0.01).toFixed(2)),
    crit: safeNumber((safeNumber(stats.crit) + level * 0.015).toFixed(2)),
  };
}

function getActivePet(player = {}) {
  const pets = normalizePets(player.pets || []);
  const activePetId = normalizeId(player.activePetId);

  if (activePetId) {
    const activeById = pets.find((pet) => normalizeId(pet.id) === activePetId);

    if (activeById) return activeById;
  }

  return pets.find((pet) => pet.active === true) || null;
}

function applyPetStats(stats = {}, activePet = null) {
  if (!activePet) return stats;

  const petStats = calculatePetStats(activePet);

  return {
    attack: Math.floor(safeNumber(stats.attack) + petStats.attack),
    defense: Math.floor(safeNumber(stats.defense) + petStats.defense),
    maxHp: Math.floor(safeNumber(stats.maxHp) + petStats.maxHp),
    dodge: safeNumber(Math.min(50, safeNumber(stats.dodge) + petStats.dodge).toFixed(2)),
    crit: safeNumber(Math.min(65, safeNumber(stats.crit) + petStats.crit).toFixed(2)),
  };
}

function calculatePower(player = {}) {
  return Math.floor(
    safeNumber(player.attack) * 1 +
      safeNumber(player.defense) * 1.35 +
      safeNumber(player.maxHp) * 0.16 +
      safeNumber(player.dodge) * 4.5 +
      safeNumber(player.crit) * 4.5 +
      safeNumber(player.level, 1) * 100
  );
}

function calculateOverallScore(player = {}) {
  return Math.floor(calculatePower(player) + safeNumber(player.monsterKills) * 3);
}

function getRank(level = 1) {
  const ranks = [
    { level: 99, name: "👑 Eternal Legend" },
    { level: 80, name: "🐉 Dragon Slayer" },
    { level: 70, name: "🔥 Mythic Champion" },
    { level: 60, name: "⚔️ Warlord" },
    { level: 50, name: "🛡️ Elite Knight" },
    { level: 40, name: "🌑 Shadow Warrior" },
    { level: 30, name: "🏹 Veteran Adventurer" },
    { level: 20, name: "⚒️ Skilled Fighter" },
    { level: 10, name: "🧭 Adventurer" },
    { level: 1, name: "🌱 Beginner Adventurer" },
  ];

  return ranks.find((rank) => safeNumber(level, 1) >= rank.level)?.name || ranks.at(-1).name;
}

function getTimeValue(value) {
  if (!value) return 0;
  if (typeof value === "number") return value;
  if (value.toMillis) return value.toMillis();
  if (value.toDate) return value.toDate().getTime();

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;

  const date = new Date(value).getTime();
  return Number.isFinite(date) ? date : 0;
}

function getReviveStatus(player = {}) {
  if (safeNumber(player.hp) > 0) {
    return {
      defeated: false,
      remainingSeconds: 0,
      reviveType: null,
      ready: false,
    };
  }

  const now = Date.now();

  const reviveAt = getTimeValue(player.reviveAvailableAt);
  const raidReviveAt = getTimeValue(player.raidReviveAvailableAt);

  const timers = [reviveAt, raidReviveAt].filter((time) => time > 0);

  if (!timers.length) {
    return {
      defeated: true,
      remainingSeconds: 60,
      reviveType: "normal",
      ready: false,
    };
  }

  const earliest = Math.min(...timers);
  const ready = now >= earliest;

  return {
    defeated: true,
    remainingSeconds: Math.max(0, Math.ceil((earliest - now) / 1000)),
    reviveType: earliest === raidReviveAt ? "raid" : "normal",
    ready,
  };
}

function normalizeItem(item = {}) {
  if (!item) return null;

  return {
    ...item,
    id: safeText(item.id, "unknown_item"),
    baseItemId: safeText(item.baseItemId || item.id, "unknown_item"),
    name: safeText(item.name, "Unknown Item"),
    type: safeText(item.type, "Unknown"),
    quality: safeText(item.quality, "Common"),
    qualityEmoji: item.qualityEmoji || getQualityEmoji(item.quality),
    requiredLevel: safeNumber(item.requiredLevel, 1),
    compatibleClasses: Array.isArray(item.compatibleClasses)
      ? item.compatibleClasses
      : ["all"],
    price: safeNumber(item.price),
    quantity: Math.max(1, safeNumber(item.quantity, 1)),
    source: safeText(item.source, "unknown"),
    emoji: item.emoji || "📦",
    description: safeText(item.description, "No bonus stats"),
    stats: normalizeStats(item.stats || {}),
  };
}

function normalizeInventory(inventory = []) {
  return Array.isArray(inventory)
    ? inventory.map(normalizeItem).filter(Boolean)
    : [];
}

function normalizeEquipment(equipment = {}) {
  const result = {};

  for (const slot of EQUIPMENT_SLOTS) {
    result[slot] = equipment?.[slot] ? normalizeItem(equipment[slot]) : null;
  }

  return result;
}

function getWorldName(player = {}) {
  if (player.world?.name) return safeText(player.world.name);
  if (player.world?.id) return getWorldConfig(player.world.id)?.name || player.world.id;

  return "Unknown World";
}

function getWorldId(player = {}) {
  return safeText(player.world?.id || player.worldId, "unknown_world");
}

function getClassName(player = {}) {
  return safeText(player.class || player.className || getClassConfig(player.classId).name, "Adventurer");
}

function getClassEmoji(player = {}) {
  return safeText(player.classEmoji || getClassConfig(player.classId).emoji, "⚔️");
}

function normalizePlayer(player = {}, discordUser = null) {
  const level = Math.max(1, Math.min(MAX_LEVEL, safeNumber(player.level, 1)));
  const classId = normalizeId(player.classId || "swordsman");

  const baseStats = getBaseStatsByClassLevel(classId, level);
  const equipment = normalizeEquipment(player.equipment || {});
  const equipmentStats = calculateEquipmentStats(baseStats, equipment);

  const pets = normalizePets(player.pets || []);
  const activePet = getActivePet({
    ...player,
    pets,
  });

  const totalStats = applyPetStats(equipmentStats, activePet);

  const hp = Math.min(
    Math.max(0, safeNumber(player.hp, totalStats.maxHp)),
    totalStats.maxHp
  );

  const exp = Math.max(0, safeNumber(player.exp));
  const requiredExp = getRequiredExp(level);

  const normalized = {
    userId: safeText(player.userId || discordUser?.id, null),
    username: safeText(
      player.username || discordUser?.globalName || discordUser?.username,
      "Unknown Player"
    ),
    avatarUrl: discordUser?.avatarUrl || null,

    worldId: getWorldId(player),
    worldName: getWorldName(player),

    classId,
    className: getClassName(player),
    classEmoji: getClassEmoji(player),

    rank: getRank(level),

    level,
    maxLevel: MAX_LEVEL,
    exp,
    requiredExp,
    expPercent: requiredExp ? Math.min(100, Math.floor((exp / requiredExp) * 100)) : 100,

    gold: safeNumber(player.gold),
    hp,
    maxHp: totalStats.maxHp,
    hpPercent: totalStats.maxHp > 0 ? Math.min(100, Math.floor((hp / totalStats.maxHp) * 100)) : 0,

    attack: totalStats.attack,
    defense: totalStats.defense,
    dodge: totalStats.dodge,
    crit: totalStats.crit,

    baseStats,
    equipmentStats,
    totalStats,

    power: 0,
    overallScore: 0,

    weapon: safeText(player.weapon || equipment.weapon?.name, "Unknown Weapon"),
    equipment,

    inventory: normalizeInventory(player.inventory || []),
    inventoryCount: normalizeInventory(player.inventory || []).reduce(
      (total, item) => total + safeNumber(item.quantity, 1),
      0
    ),

    pets,
    petsOwned: pets.length,
    activePetId: player.activePetId || activePet?.id || null,
    activePet,
    activePetStats: activePet ? calculatePetStats(activePet) : null,

    monsterKills: safeNumber(player.monsterKills),
    bossKills: safeNumber(player.bossKills),
    totalBossDamage: safeNumber(player.totalBossDamage),
    retreats: safeNumber(player.retreats),

    privateChannelId: player.privateChannelId || null,

    reviveStatus: getReviveStatus({
      ...player,
      hp,
    }),

    createdAt: player.createdAt || null,
    updatedAt: player.updatedAt || null,
  };

  normalized.power = calculatePower(normalized);
  normalized.overallScore = calculateOverallScore(normalized);

  return normalized;
}

function normalizeBoss(boss = {}, ranking = []) {
  const world = getWorldConfig(boss.worldId);

  const hp = Math.max(0, safeNumber(boss.hp));
  const maxHp = Math.max(1, safeNumber(boss.maxHp, hp || 1));

  return {
    worldId: safeText(boss.worldId, "unknown_world"),
    worldName: world?.name || safeText(boss.worldId, "Unknown World"),

    bossId: safeText(boss.bossId, "unknown_boss"),
    bossName: safeText(boss.bossName, "Unknown Boss"),
    tier: safeText(boss.tier, "unknown"),

    level: safeNumber(boss.level, 1),
    hp,
    maxHp,
    hpPercent: Math.max(0, Math.min(100, Math.floor((hp / maxHp) * 100))),

    attack: safeNumber(boss.attack),
    defense: safeNumber(boss.defense),
    dodge: safeNumber(boss.dodge),
    crit: safeNumber(boss.crit),

    recommendedLevel: boss.recommendedLevel || { min: 1, max: boss.level || 1 },

    status: safeText(boss.status, "unknown"),

    ranking: ranking.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId || entry.id,
      username: safeText(entry.username, "Unknown"),
      damage: safeNumber(entry.damage),
      hits: safeNumber(entry.hits),
      partyId: entry.partyId || null,
      threat: safeNumber(entry.threat),
    })),

    spawnedAt: boss.spawnedAt || null,
    expiresAt: boss.expiresAt || null,
  };
}

module.exports = {
  EQUIPMENT_SLOTS,
  MAX_LEVEL,
  WORLDS,
  CLASSES,
  PET_DATA,
  PET_EMOJIS,
  BOSS_SCHEDULE,
  BOSSES,

  safeNumber,
  safeText,

  getRequiredExp,
  getBaseStatsByClassLevel,
  calculateEquipmentStats,
  calculatePetStats,
  applyPetStats,
  calculatePower,
  calculateOverallScore,

  normalizeItem,
  normalizeInventory,
  normalizeEquipment,
  normalizePet,
  normalizePets,
  normalizePlayer,
  normalizeBoss,
};