const balanceConfig = require("../data/balanceConfig");

function normalizeQuality(quality = "Common") {
  const text = String(quality || "Common").trim();

  const qualityMap = {
    starter: "Starter",
    common: "Common",
    rare: "Rare",
    legendary: "Legendary",
  };

  return qualityMap[text.toLowerCase()] || text;
}

function getQualityEmoji(quality = "Common") {
  const normalizedQuality = normalizeQuality(quality);

  return (
    balanceConfig.quality?.[normalizedQuality]?.emoji ||
    {
      Starter: "🌱",
      Common: "🟢",
      Rare: "🔵",
      Legendary: "🟠",
    }[normalizedQuality] ||
    "⚪"
  );
}

function getQualityColor(quality = "Common") {
  const normalizedQuality = normalizeQuality(quality);

  return (
    balanceConfig.quality?.[normalizedQuality]?.color ||
    {
      Starter: "#84CC16",
      Common: "#22C55E",
      Rare: "#3B82F6",
      Legendary: "#F59E0B",
    }[normalizedQuality] ||
    "#94A3B8"
  );
}

module.exports = {
  normalizeQuality,
  getQualityEmoji,
  getQualityColor,
};