const express = require("express");
const requireAuth = require("../middleware/requireAuth");
const { db } = require("../firebase/firebase");

const {
  PET_DATA,
  normalizePlayer,
  normalizePet,
  calculatePetStats,
  getRequiredExp,
} = require("../game/syxthGameUtils");

const router = express.Router();

function getBasePetData() {
  return PET_DATA.map((pet) => ({
    ...pet,
    emoji: pet.emoji || "🐾",
  }));
}

function buildPetDex(playerPets = [], activePetId = null) {
  const ownedPets = playerPets.map(normalizePet).filter(Boolean);

  return getBasePetData().map((basePet) => {
    const ownedCopies = ownedPets.filter(
      (pet) => pet.basePetId === basePet.id || pet.id === basePet.id
    );

    const bestOwned = ownedCopies
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        return b.price - a.price;
      })[0] || null;

    return {
      ...basePet,
      owned: ownedCopies.length > 0,
      ownedCount: ownedCopies.length,
      active: bestOwned ? bestOwned.id === activePetId : false,
      bestOwned: bestOwned
        ? {
            ...bestOwned,
            calculatedStats: calculatePetStats(bestOwned),
          }
        : null,
    };
  });
}

router.get("/", async (req, res) => {
  try {
    return res.json({
      ok: true,
      pets: getBasePetData(),
    });
  } catch (error) {
    console.error("PetDex error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load pets.",
    });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const userId = user.id;

    const playerDoc = await db.collection("players").doc(userId).get();

    if (!playerDoc.exists) {
      return res.status(404).json({
        ok: false,
        error: "No SYXTH player found for this Discord account.",
      });
    }

    const player = normalizePlayer(playerDoc.data(), user);

    return res.json({
      ok: true,
      pets: player.pets,
      activePet: player.activePet,
      activePetStats: player.activePetStats,
      petdex: buildPetDex(player.pets, player.activePetId),
    });
  } catch (error) {
    console.error("Player pets error:", error);

    return res.status(500).json({
      ok: false,
      error: "Failed to load player pets.",
    });
  }
});

module.exports = router;