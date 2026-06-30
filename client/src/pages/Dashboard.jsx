import { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Sword,
  Heart,
  Zap,
  Coins,
  Skull,
  Backpack,
  PawPrint,
  Trophy,
  RefreshCw,
  Activity,
  Sparkles,
  Package,
} from "lucide-react";
import DiscordEmoji from "../components/DiscordEmoji";
import { API_URL, getAuthHeaders } from "../api/api";

const API_BASE = `${API_URL}/api`;

function formatNumber(value) {
  const number = Number(value || 0);
  return number.toLocaleString();
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function titleCase(value = "") {
  return String(value || "")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function StatCard({ icon: Icon, label, value, tone = "default" }) {
  return (
    <div className={`syxth-stat-card syxth-stat-card-${tone}`}>
      <div className="syxth-stat-icon">
        <Icon size={20} />
      </div>
      <div className="syxth-stat-content">
        <p>{label}</p>
        <h3>{value ?? "0"}</h3>
      </div>
    </div>
  );
}

function Bar({ label, value, max, percent, rightText, danger = false }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));

  return (
    <div className="syxth-progress-block">
      <div className="syxth-progress-head">
        <span>{label}</span>
        <strong>{rightText || `${value}/${max}`}</strong>
      </div>
      <div className="syxth-progress-track">
        <div
          className={`syxth-progress-fill ${danger ? "danger" : ""}`}
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

function EquipmentSlot({ slot, item }) {
  return (
    <div className={`syxth-equipment-slot ${item ? "equipped" : "empty"}`}>
      <div className="syxth-slot-top">
        <span className="syxth-slot-label">{titleCase(slot)}</span>
        <span className="syxth-slot-status">{item ? "Equipped" : "Empty"}</span>
      </div>

      {item ? (
        <>
          <strong className="syxth-equipment-name">{item.name || "Unknown Item"}</strong>
          <div className="syxth-equipment-meta">
            <span>{item.quality || "Common"}</span>
            <span>{item.type || "Item"}</span>
            <span>Lv.{item.requiredLevel || 1}</span>
          </div>
          <p>{item.description || "No bonus stats"}</p>
        </>
      ) : (
        <>
          <strong className="syxth-equipment-name">No item equipped</strong>
          <p>Use Discord equip commands to fill this slot.</p>
        </>
      )}
    </div>
  );
}

function QualityPill({ label, count }) {
  return (
    <span className="syxth-pill">
      {label}
      <strong>{count}</strong>
    </span>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState(null);
  const [error, setError] = useState("");

  async function loadPlayer(options = {}) {
    const showLoading = options?.showLoading !== false;

    try {
      if (showLoading) {
        setLoading(true);
      }

      setError("");

      const res = await fetch(`${API_BASE}/player/me`, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Failed to load player.");
      }

      setPlayer(data.player);
    } catch (err) {
      setError(err.message || "Failed to load player.");
      setPlayer(null);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function initialLoad() {
      try {
        const res = await fetch(`${API_BASE}/player/me`, {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Failed to load player.");
        }

        if (!cancelled) {
          setPlayer(data.player);
          setError("");
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Failed to load player.");
          setPlayer(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const inventorySummary = useMemo(() => {
    const inventory = player?.inventory || [];

    return inventory.reduce(
      (summary, item) => {
        const quantity = Number(item.quantity || 1);
        const quality = String(item.quality || "Common").toLowerCase();
        const type = String(item.type || "").toLowerCase();

        summary.total += quantity;

        if (quality === "common") summary.common += quantity;
        if (quality === "rare") summary.rare += quantity;
        if (quality === "legendary") summary.legendary += quantity;
        if (type === "consumable") summary.consumable += quantity;

        return summary;
      },
      {
        total: 0,
        common: 0,
        rare: 0,
        legendary: 0,
        consumable: 0,
      }
    );
  }, [player]);

  const petSummary = useMemo(() => {
    const pets = player?.pets || [];

    return pets.reduce(
      (summary, pet) => {
        const quality = String(pet.quality || "Common").toLowerCase();

        summary.total += 1;

        if (quality === "common") summary.common += 1;
        if (quality === "rare") summary.rare += 1;
        if (quality === "legendary") summary.legendary += 1;
        if (pet.locked) summary.locked += 1;

        return summary;
      },
      {
        total: 0,
        common: 0,
        rare: 0,
        legendary: 0,
        locked: 0,
      }
    );
  }, [player]);

  if (loading) {
    return (
      <main className="page syxth-dashboard">
        <div className="syxth-dashboard-card syxth-loading-card">
          <Activity size={22} />
          <p>Loading player dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page syxth-dashboard">
        <div className="syxth-dashboard-card syxth-error-card">
          <h1>Dashboard</h1>
          <p className="error-text">{error}</p>
          <button className="syxth-refresh-btn" onClick={() => loadPlayer()}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!player) return null;

  const equipmentSlots = [
    "weapon",
    "helmet",
    "armor",
    "gloves",
    "pants",
    "boots",
  ];

  const hpPercent = Number(player.hpPercent || 0);
  const expPercent = Number(player.expPercent || 0);
  const playerName = player.username || "Unknown Player";
  const className = player.className || player.class || "Novice";
  const worldName = player.worldName || "Unknown World";
  const rank = player.rank || "Unranked";

  return (
    <main className="page syxth-dashboard">
      <section className="syxth-dashboard-hero">
        <div className="syxth-hero-left">
          <p className="syxth-eyebrow">SYXTH Player Dashboard</p>

          <h1>
            <span className="syxth-class-mark">{player.classEmoji || "⚔️"}</span>
            {playerName}
          </h1>

          <div className="syxth-hero-meta">
            <span>{rank}</span>
            <span>{className}</span>
            <span>{worldName}</span>
          </div>
        </div>

        <div className="syxth-hero-right">
          <div className="syxth-power-card">
            <span>Total Power</span>
            <strong>{formatNumber(player.power)}</strong>
          </div>

          <button
            className="syxth-refresh-btn"
            onClick={() => loadPlayer({ showLoading: false })}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      <section className="syxth-stat-grid">
        <StatCard
          icon={Trophy}
          label="Level"
          value={`${player.level || 1}/${player.maxLevel || "MAX"}`}
          tone="gold"
        />
        <StatCard icon={Zap} label="Power" value={formatNumber(player.power)} />
        <StatCard icon={Coins} label="Gold" value={formatNumber(player.gold)} />
        <StatCard
          icon={Skull}
          label="Monster Kills"
          value={formatNumber(player.monsterKills)}
        />
      </section>

      <section className="syxth-dashboard-grid">
        <div className="syxth-dashboard-card">
          <div className="syxth-card-title">
            <Activity size={20} />
            <h2>Progress</h2>
          </div>

          <Bar
            label="HP"
            value={player.hp}
            max={player.maxHp}
            percent={hpPercent}
            danger={hpPercent <= 30}
          />

          <Bar
            label="EXP"
            value={player.exp}
            max={player.requiredExp || "MAX"}
            percent={expPercent}
            rightText={
              player.requiredExp ? `${player.exp}/${player.requiredExp}` : "MAX"
            }
          />

          {player.reviveStatus?.defeated && (
            <div className="syxth-warning-box">
              {player.reviveStatus.ready
                ? "Revive is ready in Discord."
                : `Defeated. Revive in ${player.reviveStatus.remainingSeconds}s.`}
            </div>
          )}
        </div>

        <div className="syxth-dashboard-card">
          <div className="syxth-card-title">
            <Sword size={20} />
            <h2>Combat Stats</h2>
          </div>

          <div className="syxth-combat-grid">
            <StatCard icon={Sword} label="Attack" value={formatNumber(player.attack)} />
            <StatCard icon={Shield} label="Defense" value={formatNumber(player.defense)} />
            <StatCard icon={Heart} label="Max HP" value={formatNumber(player.maxHp)} />
            <StatCard icon={Zap} label="Dodge" value={formatPercent(player.dodge)} />
            <StatCard icon={Sparkles} label="Crit" value={formatPercent(player.crit)} />
          </div>
        </div>
      </section>

      <section className="syxth-dashboard-card syxth-equipment-card">
        <div className="syxth-card-title">
          <Package size={20} />
          <h2>Equipment</h2>
        </div>

        <div className="syxth-equipment-grid">
          {equipmentSlots.map((slot) => (
            <EquipmentSlot
              key={slot}
              slot={slot}
              item={player.equipment?.[slot]}
            />
          ))}
        </div>
      </section>

      <section className="syxth-dashboard-grid">
        <div className="syxth-dashboard-card">
          <div className="syxth-card-title">
            <PawPrint size={20} />
            <h2>Active Pet</h2>
          </div>

          {player.activePet ? (
            <div className="syxth-active-pet">
              <div className="syxth-pet-avatar">
                <DiscordEmoji value={player.activePet.emoji || "🐾"} size={38} />
              </div>

              <div className="syxth-pet-info">
                <h3>{player.activePet.name}</h3>
                <p>
                  {player.activePet.qualityEmoji} {player.activePet.quality} •{" "}
                  {String(player.activePet.type || "balanced").toUpperCase()}
                </p>
                <p>
                  Level {player.activePet.level || 1} • EXP{" "}
                  {player.activePet.exp ?? 0}
                </p>
              </div>
            </div>
          ) : (
            <p className="syxth-empty-text">No active pet equipped.</p>
          )}

          {player.activePetStats && (
            <div className="syxth-pet-stat-list">
              <span>ATK +{player.activePetStats.attack}</span>
              <span>DEF +{player.activePetStats.defense}</span>
              <span>HP +{player.activePetStats.maxHp}</span>
              <span>Dodge +{player.activePetStats.dodge}%</span>
              <span>Crit +{player.activePetStats.crit}%</span>
            </div>
          )}
        </div>

        <div className="syxth-dashboard-card">
          <div className="syxth-card-title">
            <Backpack size={20} />
            <h2>Inventory Summary</h2>
          </div>

          <div className="syxth-pill-row">
            <QualityPill label="Total" count={inventorySummary.total} />
            <QualityPill label="Common" count={inventorySummary.common} />
            <QualityPill label="Rare" count={inventorySummary.rare} />
            <QualityPill label="Legendary" count={inventorySummary.legendary} />
            <QualityPill
              label="Consumable"
              count={inventorySummary.consumable}
            />
          </div>
        </div>
      </section>

      <section className="syxth-dashboard-card">
        <div className="syxth-card-title">
          <PawPrint size={20} />
          <h2>Pet Summary</h2>
        </div>

        <div className="syxth-pill-row">
          <QualityPill label="Total" count={petSummary.total} />
          <QualityPill label="Common" count={petSummary.common} />
          <QualityPill label="Rare" count={petSummary.rare} />
          <QualityPill label="Legendary" count={petSummary.legendary} />
          <QualityPill label="Locked" count={petSummary.locked} />
        </div>
      </section>
    </main>
  );
}
