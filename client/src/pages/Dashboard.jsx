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
} from "lucide-react";
import DiscordEmoji from "../components/DiscordEmoji";

const API_BASE = "http://localhost:5000/api";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function Bar({ label, value, max, percent, rightText }) {
  const safePercent = Math.max(0, Math.min(100, Number(percent || 0)));

  return (
    <div className="progress-block">
      <div className="progress-head">
        <span>{label}</span>
        <strong>{rightText || `${value}/${max}`}</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${safePercent}%` }} />
      </div>
    </div>
  );
}

function EquipmentSlot({ slot, item }) {
  return (
    <div className="equipment-slot">
      <span className="slot-label">{slot}</span>
      {item ? (
        <>
          <strong>
            {item.emoji || "📦"} {item.name}
          </strong>
          <small>
            {item.qualityEmoji || ""} {item.quality} • Lv.{item.requiredLevel}
          </small>
          <small>{item.description}</small>
        </>
      ) : (
        <>
          <strong>Empty</strong>
          <small>No item equipped</small>
        </>
      )}
    </div>
  );
}

function QualityPill({ label, count }) {
  return (
    <span className="pill">
      {label}: <strong>{count}</strong>
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
      <main className="page">
        <div className="page-card">
          <p>Loading player dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <div className="page-card">
          <h1>Dashboard</h1>
          <p className="error-text">{error}</p>
          <button className="primary-btn" onClick={() => loadPlayer()}>
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

  return (
    <main className="page">
      <section className="hero-card dashboard-hero">
        <div>
          <p className="eyebrow">SYXTH Player Dashboard</p>
          <h1>
            {player.classEmoji} {player.username}
          </h1>
          <p>
            {player.rank} • {player.className} • {player.worldName}
          </p>
        </div>

        <button className="ghost-btn" onClick={() => loadPlayer()}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      <section className="stats-grid">
        <StatCard
          icon={Trophy}
          label="Level"
          value={`${player.level}/${player.maxLevel}`}
        />
        <StatCard
          icon={Zap}
          label="Power"
          value={player.power?.toLocaleString()}
        />
        <StatCard
          icon={Coins}
          label="Gold"
          value={player.gold?.toLocaleString()}
        />
        <StatCard
          icon={Skull}
          label="Monster Kills"
          value={player.monsterKills?.toLocaleString()}
        />
      </section>

      <section className="grid-2">
        <div className="page-card">
          <h2>Progress</h2>

          <Bar
            label="HP"
            value={player.hp}
            max={player.maxHp}
            percent={player.hpPercent}
          />

          <Bar
            label="EXP"
            value={player.exp}
            max={player.requiredExp || "MAX"}
            percent={player.expPercent}
            rightText={
              player.requiredExp ? `${player.exp}/${player.requiredExp}` : "MAX"
            }
          />

          {player.reviveStatus?.defeated && (
            <div className="warning-box">
              {player.reviveStatus.ready
                ? "Revive is ready in Discord."
                : `Defeated. Revive in ${player.reviveStatus.remainingSeconds}s.`}
            </div>
          )}
        </div>

        <div className="page-card">
          <h2>Combat Stats</h2>
          <div className="mini-stat-grid">
            <StatCard icon={Sword} label="Attack" value={player.attack} />
            <StatCard icon={Shield} label="Defense" value={player.defense} />
            <StatCard icon={Heart} label="Max HP" value={player.maxHp} />
            <StatCard icon={Zap} label="Dodge" value={`${player.dodge}%`} />
            <StatCard icon={Zap} label="Crit" value={`${player.crit}%`} />
          </div>
        </div>
      </section>

      <section className="grid-2">
        <div className="page-card">
          <h2>Equipment</h2>
          <div className="equipment-grid">
            {equipmentSlots.map((slot) => (
              <EquipmentSlot
                key={slot}
                slot={slot}
                item={player.equipment?.[slot]}
              />
            ))}
          </div>
        </div>

        <div className="page-card">
          <h2>Active Pet</h2>

          {player.activePet ? (
            <div className="active-pet-card">
              <div className="pet-emoji">
                <DiscordEmoji value={player.activePet.emoji || "🐾"} size={38} />
              </div>
              <div>
                <h3>{player.activePet.name}</h3>
                <p>
                  {player.activePet.qualityEmoji} {player.activePet.quality} •{" "}
                  {String(player.activePet.type || "balanced").toUpperCase()}
                </p>
                <p>
                  Level {player.activePet.level} • EXP{" "}
                  {player.activePet.exp ?? 0}
                </p>
              </div>
            </div>
          ) : (
            <p>No active pet equipped.</p>
          )}

          {player.activePetStats && (
            <div className="pet-stat-list">
              <span>ATK +{player.activePetStats.attack}</span>
              <span>DEF +{player.activePetStats.defense}</span>
              <span>HP +{player.activePetStats.maxHp}</span>
              <span>Dodge +{player.activePetStats.dodge}%</span>
              <span>Crit +{player.activePetStats.crit}%</span>
            </div>
          )}
        </div>
      </section>

      <section className="grid-2">
        <div className="page-card">
          <h2>
            <Backpack size={20} /> Inventory Summary
          </h2>

          <div className="pill-row">
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

        <div className="page-card">
          <h2>
            <PawPrint size={20} /> Pet Summary
          </h2>

          <div className="pill-row">
            <QualityPill label="Total" count={petSummary.total} />
            <QualityPill label="Common" count={petSummary.common} />
            <QualityPill label="Rare" count={petSummary.rare} />
            <QualityPill label="Legendary" count={petSummary.legendary} />
            <QualityPill label="Locked" count={petSummary.locked} />
          </div>
        </div>
      </section>
    </main>
  );
}