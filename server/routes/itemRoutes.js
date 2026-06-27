const express = require("express");

const swordsmanItems = require("../data/items/swordsmanItems");
const archerItems = require("../data/items/archerItems");
const assassinItems = require("../data/items/assassinItems");
const tankerItems = require("../data/items/tankerItems");
const consumables = require("../data/items/consumables");

const router = express.Router();

const allItems = [
  ...swordsmanItems,
  ...archerItems,
  ...assassinItems,
  ...tankerItems,
  ...consumables,
].map(normalizeItem);

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getItemSlot(item = {}) {
  const type = normalizeText(item.type);

  if (type === "weapon") return "weapon";
  if (type === "helmet") return "helmet";
  if (type === "armor") return "armor";
  if (type === "gloves") return "gloves";
  if (type === "pants") return "pants";
  if (type === "boots") return "boots";
  if (type === "consumable") return "consumable";

  return "unknown";
}

function normalizeStats(stats = {}) {
  return {
    attack: Number(stats.attack || 0),
    defense: Number(stats.defense || 0),
    maxHp: Number(stats.maxHp || 0),
    dodge: Number(stats.dodge || 0),
    crit: Number(stats.crit || 0),
  };
}

function normalizeItem(item = {}) {
  return {
    id: item.id,
    baseItemId: item.baseItemId || item.id,

    name: item.name || "Unknown Item",
    type: item.type || "Unknown",
    slot: item.slot || getItemSlot(item),

    quality: item.quality || "Common",
    qualityEmoji: item.qualityEmoji || "🟢",

    emoji: item.emoji || "📦",
    description: item.description || "No description available.",

    requiredLevel: Number(item.requiredLevel || 1),
    compatibleClasses: Array.isArray(item.compatibleClasses)
      ? item.compatibleClasses
      : ["all"],

    price: Number(item.price || 0),
    source: item.source || "shop",
    quantity: Number(item.quantity || 1),

    stats: normalizeStats(item.stats),

    healPercent: Number(item.healPercent || 0),
    healAmount: Number(item.healAmount || 0),
  };
}

function itemMatchesSearch(item, search) {
  const term = normalizeText(search);

  if (!term) return true;

  const haystack = [
    item.id,
    item.name,
    item.type,
    item.slot,
    item.quality,
    item.description,
    item.source,
    ...(item.compatibleClasses || []),
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(term);
}

function itemMatchesType(item, type) {
  const selectedType = normalizeText(type);

  if (!selectedType || selectedType === "all") return true;

  return normalizeText(item.type) === selectedType || normalizeText(item.slot) === selectedType;
}

function itemMatchesClass(item, classId) {
  const selectedClass = normalizeText(classId);

  if (!selectedClass || selectedClass === "all") return true;

  const classes = item.compatibleClasses || [];

  return classes.some((entry) => {
    const normalizedEntry = normalizeText(entry);
    return normalizedEntry === "all" || normalizedEntry === selectedClass;
  });
}

function itemMatchesQuality(item, quality) {
  const selectedQuality = normalizeText(quality);

  if (!selectedQuality || selectedQuality === "all") return true;

  return normalizeText(item.quality) === selectedQuality;
}

function getMeta(items) {
  return {
    total: items.length,
    types: [...new Set(allItems.map((item) => item.type))].sort(),
    slots: [...new Set(allItems.map((item) => item.slot))].sort(),
    qualities: [...new Set(allItems.map((item) => item.quality))].sort(),
    classes: ["swordsman", "archer", "assassin", "tanker"],
  };
}

router.get("/", (req, res) => {
  const {
    search = "",
    type = "all",
    classId = "all",
    quality = "all",
    minLevel,
    maxLevel,
  } = req.query;

  let items = allItems.filter((item) => {
    const matchesSearch = itemMatchesSearch(item, search);
    const matchesType = itemMatchesType(item, type);
    const matchesClass = itemMatchesClass(item, classId);
    const matchesQuality = itemMatchesQuality(item, quality);

    const level = Number(item.requiredLevel || 1);
    const matchesMinLevel = minLevel ? level >= Number(minLevel) : true;
    const matchesMaxLevel = maxLevel ? level <= Number(maxLevel) : true;

    return (
      matchesSearch &&
      matchesType &&
      matchesClass &&
      matchesQuality &&
      matchesMinLevel &&
      matchesMaxLevel
    );
  });

  items = items.sort((a, b) => {
    if (a.requiredLevel !== b.requiredLevel) {
      return a.requiredLevel - b.requiredLevel;
    }

    return a.name.localeCompare(b.name);
  });

  res.json({
    ok: true,
    items,
    meta: getMeta(items),
  });
});

router.get("/:id", (req, res) => {
  const itemId = normalizeText(req.params.id);
  const item = allItems.find((entry) => normalizeText(entry.id) === itemId);

  if (!item) {
    return res.status(404).json({
      ok: false,
      error: "Item not found.",
    });
  }

  return res.json({
    ok: true,
    item,
  });
});

module.exports = router;