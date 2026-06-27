const express = require("express");
const { db } = require("../firebase/firebase");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

const INVENTORY_FIELDS = ["inventory", "items", "backpack"];

function makeHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
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

function getDisplayName(user = {}) {
  return (
    user.globalName ||
    user.global_name ||
    user.displayName ||
    user.username ||
    "Discord User"
  );
}

function getItemIdentity(item = {}) {
  return normalizeText(
    item.instanceId ||
      item.inventoryId ||
      item.uniqueId ||
      item.uid ||
      item.itemUid ||
      item.id ||
      item.baseItemId ||
      item.name
  );
}

function getItemName(item = {}) {
  return normalizeText(item.name || item.itemName || "Unknown Item");
}

function getItemEmoji(item = {}) {
  return normalizeText(item.emoji || item.itemEmoji || "📦");
}

function getItemQuality(item = {}) {
  return normalizeText(item.quality || item.itemQuality || "Common");
}

function getItemType(item = {}) {
  return normalizeText(item.type || item.itemType || "Unknown");
}

function getItemId(item = {}) {
  return normalizeText(
    item.id || item.baseItemId || item.itemId || getItemName(item)
  );
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

function sanitizeItemSnapshot(item = {}) {
  return {
    id: getItemId(item),
    baseItemId: normalizeText(item.baseItemId || item.id || ""),
    instanceId: normalizeText(
      item.instanceId || item.inventoryId || item.uniqueId || item.uid || ""
    ),
    name: getItemName(item),
    emoji: getItemEmoji(item),
    quality: getItemQuality(item),
    type: getItemType(item),
    slot: normalizeText(item.slot || ""),
    description: normalizeText(item.description || ""),
    requiredLevel: Number(item.requiredLevel || 1),
    compatibleClasses: Array.isArray(item.compatibleClasses)
      ? item.compatibleClasses
      : [],
    price: Number(item.price || 0),
    quantity: Number(item.quantity || 1),
    source: normalizeText(item.source || ""),
    stats: normalizeStats(item.stats),
  };
}

function getInventoryField(playerData = {}, preferredField = "") {
  const safePreferredField = normalizeText(preferredField);

  if (safePreferredField) {
    const preferredValue = playerData[safePreferredField];

    if (
      Array.isArray(preferredValue) ||
      (preferredValue && typeof preferredValue === "object")
    ) {
      return safePreferredField;
    }
  }

  for (const field of INVENTORY_FIELDS) {
    const value = playerData[field];

    if (Array.isArray(value)) {
      return field;
    }

    if (value && typeof value === "object") {
      return field;
    }
  }

  return "inventory";
}

function makeInventoryKey({ item, index, objectKey, type }) {
  if (type === "object") {
    return `obj:${objectKey}`;
  }

  return `arr:${index}:${getItemIdentity(item)}`;
}

function getInventoryState(playerData = {}, preferredField = "") {
  const field = getInventoryField(playerData, preferredField);
  const rawInventory = playerData[field];

  if (Array.isArray(rawInventory)) {
    const entries = rawInventory.map((item, index) => ({
      type: "array",
      field,
      index,
      objectKey: null,
      key: makeInventoryKey({
        item,
        index,
        type: "array",
      }),
      item: item || {},
    }));

    return {
      field,
      type: "array",
      raw: rawInventory,
      entries,
    };
  }

  if (rawInventory && typeof rawInventory === "object") {
    const entries = Object.entries(rawInventory).map(
      ([objectKey, item], index) => ({
        type: "object",
        field,
        index,
        objectKey,
        key: makeInventoryKey({
          item,
          index,
          objectKey,
          type: "object",
        }),
        item: item || {},
      })
    );

    return {
      field,
      type: "object",
      raw: rawInventory,
      entries,
    };
  }

  return {
    field,
    type: "array",
    raw: [],
    entries: [],
  };
}

function findInventoryEntry(inventoryState, inventoryItemKey) {
  const key = normalizeText(inventoryItemKey);

  if (!key) return null;

  return (
    inventoryState.entries.find((entry) => entry.key === key) ||
    inventoryState.entries.find((entry) => getItemIdentity(entry.item) === key) ||
    null
  );
}

function updateInventoryItem(inventoryState, entry, patch = {}) {
  const nextItem = {
    ...(entry.item || {}),
    ...patch,
  };

  if (inventoryState.type === "object") {
    return {
      ...(inventoryState.raw || {}),
      [entry.objectKey]: nextItem,
    };
  }

  const nextInventory = Array.isArray(inventoryState.raw)
    ? [...inventoryState.raw]
    : [];

  nextInventory[entry.index] = nextItem;

  return nextInventory;
}

function isItemEquipped(item = {}, playerData = {}) {
  if (item.equipped || item.isEquipped) {
    return true;
  }

  const itemIdentity = getItemIdentity(item);
  const equipment = playerData.equipment || playerData.equipped || {};

  if (!equipment || typeof equipment !== "object") {
    return false;
  }

  return Object.values(equipment).some((equippedItem) => {
    if (!equippedItem) return false;

    if (typeof equippedItem === "string") {
      return normalizeText(equippedItem) === itemIdentity;
    }

    return getItemIdentity(equippedItem) === itemIdentity;
  });
}

function getNotTradeableReason(item = {}, playerData = {}) {
  if (!item || typeof item !== "object") {
    return "Invalid inventory item.";
  }

  if (item.locked || item.isLocked) {
    return "This item is locked.";
  }

  if (item.tradeLocked || item.listedTradeId) {
    return "This item is already listed on the Trade Board.";
  }

  if (isItemEquipped(item, playerData)) {
    return "Unequip this item before listing it.";
  }

  if (Number(item.quantity || 1) <= 0) {
    return "This item has no quantity left.";
  }

  return "";
}

function normalizeInventoryItem(entry, playerData = {}) {
  const item = entry.item || {};
  const reason = getNotTradeableReason(item, playerData);

  return {
    inventoryItemKey: entry.key,

    itemId: getItemId(item),
    itemName: getItemName(item),
    itemEmoji: getItemEmoji(item),
    itemQuality: getItemQuality(item),
    itemType: getItemType(item),

    requiredLevel: Number(item.requiredLevel || 1),
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    description: normalizeText(item.description || ""),
    stats: normalizeStats(item.stats),

    tradeable: !reason,
    blockedReason: reason,
  };
}

function normalizeTradeData(id, data = {}) {
  const itemSnapshot = data.itemSnapshot || {};

  return {
    id,

    sellerId: data.sellerId || "",
    sellerName: data.sellerName || "Unknown Player",

    inventoryItemKey: data.inventoryItemKey || "",
    inventoryField: data.inventoryField || "inventory",

    itemId: data.itemId || itemSnapshot.id || "",
    itemName: data.itemName || itemSnapshot.name || "Unknown Item",
    itemEmoji: data.itemEmoji || itemSnapshot.emoji || "📦",
    itemQuality: data.itemQuality || itemSnapshot.quality || "Common",
    itemType: data.itemType || itemSnapshot.type || "Unknown",

    itemSnapshot,

    askingGold: Number(data.askingGold || 0),
    note: data.note || "",

    status: data.status || "active",

    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    cancelledAt: toIsoDate(data.cancelledAt),
  };
}

function normalizeTrade(doc) {
  return normalizeTradeData(doc.id, doc.data() || {});
}

router.get("/", async (req, res) => {
  try {
    const snapshot = await db
      .collection("tradeListings")
      .where("status", "==", "active")
      .limit(100)
      .get();

    const trades = snapshot.docs
      .map(normalizeTrade)
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

    return res.json({
      ok: true,
      trades,
    });
  } catch (error) {
    console.error("Failed to load trade listings:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load trade listings.",
    });
  }
});

router.get("/my-inventory", requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const playerRef = db.collection("players").doc(user.id);
    const playerDoc = await playerRef.get();

    if (!playerDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: "Player profile not found.",
      });
    }

    const playerData = playerDoc.data() || {};
    const inventoryState = getInventoryState(playerData);

    const items = inventoryState.entries
      .map((entry) => normalizeInventoryItem(entry, playerData))
      .filter((item) => item.tradeable)
      .sort((a, b) => {
        if (a.requiredLevel !== b.requiredLevel) {
          return a.requiredLevel - b.requiredLevel;
        }

        return a.itemName.localeCompare(b.itemName);
      });

    return res.json({
      ok: true,
      items,
      inventoryField: inventoryState.field,
      totalTradeable: items.length,
    });
  } catch (error) {
    console.error("Failed to load trade inventory:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load trade inventory.",
    });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const user = req.session.user;

    const inventoryItemKey = normalizeText(req.body.inventoryItemKey);
    const askingGold = normalizeNumber(req.body.askingGold);
    const note = normalizeText(req.body.note);

    if (!inventoryItemKey) {
      return res.status(400).json({
        ok: false,
        error: "Inventory item key is required.",
      });
    }

    if (askingGold <= 0) {
      return res.status(400).json({
        ok: false,
        error: "Asking gold must be greater than 0.",
      });
    }

    const playerRef = db.collection("players").doc(user.id);
    const tradeRef = db.collection("tradeListings").doc();

    let createdTrade = null;

    await db.runTransaction(async (transaction) => {
      const playerDoc = await transaction.get(playerRef);

      if (!playerDoc.exists) {
        throw makeHttpError(404, "Player profile not found.");
      }

      const playerData = playerDoc.data() || {};
      const inventoryState = getInventoryState(playerData);
      const entry = findInventoryEntry(inventoryState, inventoryItemKey);

      if (!entry) {
        throw makeHttpError(404, "Inventory item not found.");
      }

      const blockedReason = getNotTradeableReason(entry.item, playerData);

      if (blockedReason) {
        throw makeHttpError(400, blockedReason);
      }

      const itemSnapshot = sanitizeItemSnapshot(entry.item);
      const now = new Date();

      const tradeData = {
        sellerId: user.id,
        sellerName: getDisplayName(user),

        inventoryItemKey: entry.key,
        inventoryField: inventoryState.field,

        itemId: itemSnapshot.id,
        itemName: itemSnapshot.name,
        itemEmoji: itemSnapshot.emoji,
        itemQuality: itemSnapshot.quality,
        itemType: itemSnapshot.type,

        itemSnapshot,

        askingGold,
        note,

        status: "active",

        createdAt: now,
        updatedAt: now,
      };

      const nextInventory = updateInventoryItem(inventoryState, entry, {
        tradeLocked: true,
        listedTradeId: tradeRef.id,
      });

      transaction.update(playerRef, {
        [inventoryState.field]: nextInventory,
      });

      transaction.set(tradeRef, tradeData);

      createdTrade = normalizeTradeData(tradeRef.id, tradeData);
    });

    return res.status(201).json({
      ok: true,
      trade: createdTrade,
    });
  } catch (error) {
    console.error("Failed to create trade listing:", error);

    return res.status(error.status || 500).json({
      ok: false,
      error: error.message || "Failed to create trade listing.",
    });
  }
});

router.patch("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const tradeId = normalizeText(req.params.id);

    if (!tradeId) {
      return res.status(400).json({
        ok: false,
        error: "Trade ID is required.",
      });
    }

    const tradeRef = db.collection("tradeListings").doc(tradeId);

    await db.runTransaction(async (transaction) => {
      const tradeDoc = await transaction.get(tradeRef);

      if (!tradeDoc.exists) {
        throw makeHttpError(404, "Trade listing not found.");
      }

      const trade = tradeDoc.data() || {};

      if (trade.sellerId !== user.id) {
        throw makeHttpError(403, "You can only cancel your own trade listing.");
      }

      if (trade.status !== "active") {
        throw makeHttpError(400, "This trade listing is not active.");
      }

      const playerRef = db.collection("players").doc(user.id);
      const playerDoc = await transaction.get(playerRef);

      if (playerDoc.exists) {
        const playerData = playerDoc.data() || {};
        const inventoryState = getInventoryState(
          playerData,
          trade.inventoryField
        );

        const entry = findInventoryEntry(
          inventoryState,
          trade.inventoryItemKey
        );

        if (entry) {
          const nextInventory = updateInventoryItem(inventoryState, entry, {
            tradeLocked: false,
            listedTradeId: "",
          });

          transaction.update(playerRef, {
            [inventoryState.field]: nextInventory,
          });
        }
      }

      transaction.delete(tradeRef);
    });

    return res.json({
      ok: true,
      message: "Trade listing deleted and item unlocked.",
    });
  } catch (error) {
    console.error("Failed to cancel trade listing:", error);

    return res.status(error.status || 500).json({
      ok: false,
      error: error.message || "Failed to cancel trade listing.",
    });
  }
});

module.exports = router;