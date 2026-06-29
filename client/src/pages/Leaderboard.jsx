import { useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import { API_URL } from "../api/api";

const API_BASE = `${API_URL}/api`;

const TYPES = [
  { id: "overall", label: "Overall" },
  { id: "power", label: "Power" },
  { id: "level", label: "Level" },
  { id: "gold", label: "Gold" },
  { id: "kills", label: "Kills" },
  { id: "pets", label: "Pets" },
  { id: "boss", label: "Boss Damage" },
];

async function fetchLeaderboardData(selectedType, signal) {
  const res = await fetch(`${API_BASE}/leaderboard/${selectedType}`, {
    signal,
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Failed to load leaderboard.");
  }

  return data;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function Leaderboard() {
  const [type, setType] = useState("overall");
  const [players, setPlayers] = useState([]);
  const [scoreLabel, setScoreLabel] = useState("Overall");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function refreshLeaderboard() {
    try {
      setRefreshing(true);
      setError("");

      const data = await fetchLeaderboardData(type);

      setPlayers(data.players || []);
      setScoreLabel(data.scoreLabel || "Score");
    } catch (err) {
      setError(err.message || "Failed to load leaderboard.");
      setPlayers([]);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    fetchLeaderboardData(type, controller.signal)
      .then((data) => {
        if (cancelled) return;

        setPlayers(data.players || []);
        setScoreLabel(data.scoreLabel || "Score");
        setError("");
      })
      .catch((err) => {
        if (cancelled || err.name === "AbortError") return;

        setError(err.message || "Failed to load leaderboard.");
        setPlayers([]);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [type]);

  function handleTypeChange(selectedType) {
    if (selectedType === type) return;

    setType(selectedType);
    setLoading(true);
  }

  return (
    <main className="page">
      <section className="hero-card dashboard-hero">
        <div>
          <p className="eyebrow">SYXTH Rankings</p>
          <h1>
            <Trophy size={30} /> Leaderboard
          </h1>
          <p>Ranked using the same power and overall scoring logic as the bot.</p>
        </div>

        <button
          className="ghost-btn"
          onClick={refreshLeaderboard}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      <section className="page-card">
        <div className="tab-row">
          {TYPES.map((entry) => (
            <button
              key={entry.id}
              className={type === entry.id ? "tab-btn active" : "tab-btn"}
              onClick={() => handleTypeChange(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        {loading && <p>Loading leaderboard...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Class</th>
                  <th>World</th>
                  <th>Level</th>
                  <th>Power</th>
                  <th>{scoreLabel}</th>
                </tr>
              </thead>

              <tbody>
                {players.length ? (
                  players.map((player) => (
                    <tr key={player.userId || `${player.username}-${player.rank}`}>
                      <td>
                        <strong>#{player.rank}</strong>
                      </td>

                      <td>
                        <div className="player-cell">
                          {player.avatarUrl ? (
                            <img src={player.avatarUrl} alt="" />
                          ) : (
                            <div className="avatar-fallback">
                              {String(player.username || "?").charAt(0)}
                            </div>
                          )}

                          <div>
                            <strong>{player.username}</strong>
                            <small>{player.rankTitle}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        {player.classEmoji} {player.className}
                      </td>

                      <td>{player.worldName}</td>
                      <td>{player.level}</td>
                      <td>{formatNumber(player.power)}</td>

                      <td>
                        <strong>{formatNumber(player.score)}</strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">No players found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}