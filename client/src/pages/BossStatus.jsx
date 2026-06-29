import { useEffect, useState } from "react";
import { Skull, RefreshCw, Clock, Trophy } from "lucide-react";
import { API_URL } from "../api/api";

const API_BASE = `${API_URL}/api`;

async function fetchBossStatus(signal) {
  const res = await fetch(`${API_BASE}/boss/status`, {
    signal,
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Failed to load boss status.");
  }

  return data;
}

function formatTime(value) {
  if (!value) return "Unknown";

  const date =
    value._seconds !== undefined
      ? new Date(value._seconds * 1000)
      : value.toDate
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString();
}

function getRemainingText(expiresAt) {
  if (!expiresAt) return "Unknown";

  const date =
    expiresAt._seconds !== undefined
      ? new Date(expiresAt._seconds * 1000)
      : new Date(expiresAt);

  if (Number.isNaN(date.getTime())) return "Unknown";

  const diff = date.getTime() - Date.now();

  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes <= 0) return `${seconds}s`;

  return `${minutes}m ${seconds}s`;
}

function BossCard({ entry }) {
  if (!entry.active || !entry.boss) {
    return (
      <article className="boss-card inactive">
        <h2>{entry.worldName}</h2>
        <p>No active boss.</p>
      </article>
    );
  }

  const boss = entry.boss;

  return (
    <article className="boss-card">
      <div className="boss-head">
        <div>
          <p className="eyebrow">{boss.worldName}</p>
          <h2>
            <Skull size={24} /> {boss.bossName}
          </h2>
          <p>
            {boss.tier} • Lv.{boss.level} • {boss.status}
          </p>
        </div>

        <span className="boss-level">Lv.{boss.level}</span>
      </div>

      <div className="progress-block">
        <div className="progress-head">
          <span>Boss HP</span>
          <strong>
            {boss.hp.toLocaleString()}/{boss.maxHp.toLocaleString()}
          </strong>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill danger"
            style={{ width: `${boss.hpPercent}%` }}
          />
        </div>
      </div>

      <div className="boss-stat-grid">
        <span>ATK {boss.attack}</span>
        <span>DEF {boss.defense}</span>
        <span>Dodge {boss.dodge}%</span>
        <span>Crit {boss.crit}%</span>
      </div>

      <p>
        Recommended Level:{" "}
        <strong>
          {boss.recommendedLevel?.min}-{boss.recommendedLevel?.max}
        </strong>
      </p>

      <p>
        <Clock size={15} /> Expires:{" "}
        <strong>{getRemainingText(boss.expiresAt)}</strong>
      </p>

      <div className="ranking-box">
        <h3>
          <Trophy size={18} /> Damage Ranking
        </h3>

        {boss.ranking?.length ? (
          boss.ranking.slice(0, 5).map((entry) => (
            <div className="ranking-row" key={entry.userId || entry.id}>
              <span>#{entry.rank}</span>
              <strong>{entry.username}</strong>
              <em>{Number(entry.damage || 0).toLocaleString()} dmg</em>
            </div>
          ))
        ) : (
          <p>No damage yet.</p>
        )}
      </div>

      <small>Spawned: {formatTime(boss.spawnedAt)}</small>
    </article>
  );
}

export default function BossStatus() {
  const [bosses, setBosses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [bossConfig, setBossConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadBossStatus() {
    try {
      setRefreshing(true);
      setError("");

      const data = await fetchBossStatus();

      setBosses(data.bosses || []);
      setSchedule(data.schedule || []);
      setBossConfig(data.bossConfig || {});
    } catch (err) {
      setError(err.message || "Failed to load boss status.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    async function initialLoad() {
      try {
        const data = await fetchBossStatus(controller.signal);

        if (!cancelled) {
          setBosses(data.bosses || []);
          setSchedule(data.schedule || []);
          setBossConfig(data.bossConfig || {});
          setError("");
        }
      } catch (err) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err.message || "Failed to load boss status.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    initialLoad();

    const timer = setInterval(async () => {
      try {
        const data = await fetchBossStatus();

        if (!cancelled) {
          setBosses(data.bosses || []);
          setSchedule(data.schedule || []);
          setBossConfig(data.bossConfig || {});
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to refresh boss status.");
        }
      }
    }, 30000);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return (
    <main className="page">
      <section className="hero-card dashboard-hero">
        <div>
          <p className="eyebrow">SYXTH Raid Monitor</p>
          <h1>
            <Skull size={30} /> Boss Status
          </h1>
          <p>Reads active bosses and rankings from worldBosses.</p>
        </div>

        <button
          className="ghost-btn"
          onClick={loadBossStatus}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <section className="page-card">
        <h2>Spawn Schedule</h2>

        <div className="schedule-grid">
          {schedule.map((entry) => (
            <div className="schedule-card" key={`${entry.time}-${entry.tier}`}>
              <strong>{entry.time} PHT</strong>
              <span>{entry.tier}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="boss-grid">
        {loading && (
          <div className="page-card">
            <p>Loading boss status...</p>
          </div>
        )}

        {error && (
          <div className="page-card">
            <p className="error-text">{error}</p>
          </div>
        )}

        {!loading &&
          !error &&
          bosses.map((entry) => (
            <BossCard key={entry.worldId} entry={entry} />
          ))}
      </section>

      <section className="page-card">
        <h2>Possible Bosses</h2>

        <div className="boss-list">
          {Object.entries(bossConfig).map(([tier, list]) => (
            <div key={tier}>
              <h3>{tier}</h3>

              {(list || []).map((boss) => (
                <p key={boss.id}>
                  <strong>{boss.name}</strong> — Lv.{boss.level}, Reward:{" "}
                  {boss.rewards?.gold || 0} gold / {boss.rewards?.exp || 0} EXP
                </p>
              ))}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}