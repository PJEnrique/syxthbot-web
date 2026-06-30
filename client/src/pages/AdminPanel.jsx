import { useEffect, useState } from "react";
import {
  Shield,
  Users,
  Package,
  AlertTriangle,
  RefreshCcw,
  Coins,
  Activity,
  Trophy,
  Skull,
  PawPrint,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";

import { API_URL, getAuthHeaders } from "../api/api";

const topPlayerTypes = [
  { id: "power", label: "Power" },
  { id: "level", label: "Level" },
  { id: "gold", label: "Gold" },
  { id: "kills", label: "Kills" },
  { id: "pets", label: "Pets" },
  { id: "overall", label: "Overall" },
];

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned invalid JSON.");
  }
}

function toDisplayText(value, fallback = "unknown") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const text = value
      .map((entry) => toDisplayText(entry, ""))
      .filter(Boolean)
      .join(", ");

    return text || fallback;
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.displayName ||
      value.username ||
      value.globalName ||
      value.id ||
      value.roleId ||
      fallback
    );
  }

  return fallback;
}

function formatNumber(value) {
  const number = Number(value || 0);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return number.toLocaleString();
}

function formatClass(value) {
  return toDisplayText(value, "unknown")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatWorld(value) {
  return toDisplayText(value, "unknown");
}

function getPlayerName(player) {
  return toDisplayText(
    player?.username || player?.displayName || player?.name,
    "Unknown"
  );
}

function getTopValue(player, type) {
  if (!player) return 0;

  if (type === "power") return player.power;
  if (type === "level") return player.level;
  if (type === "gold") return player.gold;
  if (type === "kills") return player.monsterKills;
  if (type === "pets") return player.petCount;
  if (type === "overall") return player.overallScore;

  return player.power;
}

async function fetchAdminData(topType = "power") {
  const [meResponse, overviewResponse, playersResponse, topPlayersResponse] =
    await Promise.all([
      fetch(`${API_URL}/api/admin/me?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      }),
      fetch(`${API_URL}/api/admin/overview?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      }),
      fetch(`${API_URL}/api/admin/recent-players?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      }),
      fetch(`${API_URL}/api/admin/top-players?type=${topType}&t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      }),
    ]);

  const meData = await readJsonResponse(meResponse);
  const overviewData = await readJsonResponse(overviewResponse);
  const playersData = await readJsonResponse(playersResponse);
  const topPlayersData = await readJsonResponse(topPlayersResponse);

  if (!meResponse.ok || !meData.ok) {
    throw new Error(meData.error || "Admin access required.");
  }

  if (!overviewResponse.ok || !overviewData.ok) {
    throw new Error(overviewData.error || "Failed to load admin overview.");
  }

  if (!playersResponse.ok || !playersData.ok) {
    throw new Error(playersData.error || "Failed to load recent players.");
  }

  if (!topPlayersResponse.ok || !topPlayersData.ok) {
    throw new Error(topPlayersData.error || "Failed to load top players.");
  }

  return {
    admin: meData.admin || null,
    overview: overviewData.overview || null,
    players: Array.isArray(playersData.players) ? playersData.players : [],
    topPlayers: Array.isArray(topPlayersData.players)
      ? topPlayersData.players
      : [],
  };
}

async function fetchTopPlayers(topType) {
  const response = await fetch(
    `${API_URL}/api/admin/top-players?type=${topType}&t=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
      headers: getAuthHeaders(),
    }
  );

  const data = await readJsonResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to load top players.");
  }

  return Array.isArray(data.players) ? data.players : [];
}

export default function AdminPanel() {
  const [admin, setAdmin] = useState(null);
  const [overview, setOverview] = useState(null);
  const [players, setPlayers] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);

  const [topType, setTopType] = useState("power");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topLoading, setTopLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const data = await fetchAdminData("power");

        if (cancelled) return;

        setAdmin(data.admin);
        setOverview(data.overview);
        setPlayers(data.players);
        setTopPlayers(data.topPlayers);
        setError("");
      } catch (err) {
        if (cancelled) return;

        setAdmin(null);
        setOverview(null);
        setPlayers([]);
        setTopPlayers([]);
        setError(err.message || "Failed to load admin panel.");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRefresh() {
    try {
      setRefreshing(true);
      setError("");

      const data = await fetchAdminData(topType);

      setAdmin(data.admin);
      setOverview(data.overview);
      setPlayers(data.players);
      setTopPlayers(data.topPlayers);
    } catch (err) {
      setError(err.message || "Failed to refresh admin panel.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleTopTypeChange(nextType) {
    try {
      setTopType(nextType);
      setTopLoading(true);
      setError("");

      const nextPlayers = await fetchTopPlayers(nextType);

      setTopPlayers(nextPlayers);
    } catch (err) {
      setTopPlayers([]);
      setError(err.message || "Failed to load top players.");
    } finally {
      setTopLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div className="sectionHeader">
          <p className="eyebrow">SYXTH Control Room</p>
          <h1>Admin Panel</h1>
          <p>Checking admin access...</p>
        </div>

        <div className="empty-state">Loading admin panel...</div>
      </section>
    );
  }

  if (error && !admin) {
    return (
      <section className="page">
        <div className="sectionHeader">
          <p className="eyebrow">SYXTH Control Room</p>
          <h1>Admin Panel</h1>
          <p>This page is restricted to allowed Discord user IDs.</p>
        </div>

        <div className="warning-box">
          <AlertTriangle size={18} />
          {error}
          <Link to="/login" className="textLink">
            Login with Discord
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="sectionHeader">
        <p className="eyebrow">SYXTH Control Room</p>
        <h1>Admin Panel</h1>
        <p>Read-only server overview for authorized admins.</p>
      </div>

      <div className="warning-box">
        <AlertTriangle size={18} />
        Admin actions are disabled. This panel is read-only until write actions
        have audit logs and confirmation checks.
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>
              <Shield size={22} /> Admin Access
            </h2>

            <p className="muted-text">
              Logged in as {toDisplayText(admin?.displayName, "Admin")}
            </p>
          </div>

          <button
            type="button"
            className="secondaryBtn smallBtn"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCcw size={16} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && <div className="errorBox">{error}</div>}
      </div>

      <div className="featureGrid">
        <StatCard
          icon={<Users size={22} />}
          title="Players"
          value={formatNumber(overview?.playersCount)}
          text="registered players"
        />

        <StatCard
          icon={<Coins size={22} />}
          title="Total Gold"
          value={formatNumber(overview?.totalGold)}
          text="gold in circulation"
        />

        <StatCard
          icon={<Skull size={22} />}
          title="Monster Kills"
          value={formatNumber(overview?.totalKills)}
          text="total recorded kills"
        />

        <StatCard
          icon={<PawPrint size={22} />}
          title="Pets"
          value={formatNumber(overview?.totalPets)}
          text="total owned pets"
        />

        <StatCard
          icon={<BarChart3 size={22} />}
          title="Average Level"
          value={formatNumber(overview?.averageLevel)}
          text="average player level"
        />

        <StatCard
          icon={<Package size={22} />}
          title="Trade Listings"
          value={formatNumber(overview?.tradeListingsCount)}
          text="total listings"
        />

        <StatCard
          icon={<Coins size={22} />}
          title="Active Trades"
          value={formatNumber(overview?.activeTradesCount)}
          text="active listings"
        />

        <StatCard
          icon={<Activity size={22} />}
          title="World Bosses"
          value={formatNumber(overview?.worldBossesCount)}
          text="boss records"
        />
      </div>

      <div className="page-card">
        <h2>
          <Trophy size={22} /> Server Leaders
        </h2>

        <div className="wiki-grid">
          <LeaderCard
            title="Top Power"
            player={overview?.topPowerPlayer}
            valueLabel="Power"
            value={overview?.topPowerPlayer?.power}
          />

          <LeaderCard
            title="Richest Player"
            player={overview?.richestPlayer}
            valueLabel="Gold"
            value={overview?.richestPlayer?.gold}
          />

          <LeaderCard
            title="Top Killer"
            player={overview?.topKiller}
            valueLabel="Kills"
            value={overview?.topKiller?.monsterKills}
          />
        </div>
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>
              <Trophy size={22} /> Top Players
            </h2>
            <p className="muted-text">
              Ranking by{" "}
              {topPlayerTypes.find((item) => item.id === topType)?.label}
            </p>
          </div>
        </div>

        <div className="tab-row">
          {topPlayerTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={topType === item.id ? "tab-btn active" : "tab-btn"}
              onClick={() => handleTopTypeChange(item.id)}
              disabled={topLoading}
            >
              {item.label}
            </button>
          ))}
        </div>

        {topLoading ? (
          <div className="empty-state">Loading top players...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Class</th>
                  <th>Level</th>
                  <th>
                    {topPlayerTypes.find((item) => item.id === topType)?.label}
                  </th>
                  <th>Power</th>
                  <th>Gold</th>
                </tr>
              </thead>

              <tbody>
                {topPlayers.map((player, index) => (
                  <tr key={player.id}>
                    <td>#{index + 1}</td>
                    <td>{getPlayerName(player)}</td>
                    <td>{formatClass(player.classId)}</td>
                    <td>{formatNumber(player.level)}</td>
                    <td>{formatNumber(getTopValue(player, topType))}</td>
                    <td>{formatNumber(player.power)}</td>
                    <td>{formatNumber(player.gold)}</td>
                  </tr>
                ))}

                {!topPlayers.length && (
                  <tr>
                    <td colSpan="7">No ranked players found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="page-card">
        <h2>
          <Activity size={22} /> Recent Players
        </h2>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Class</th>
                <th>World</th>
                <th>Level</th>
                <th>Gold</th>
                <th>Power</th>
                <th>Kills</th>
                <th>Pets</th>
                <th>Inventory</th>
              </tr>
            </thead>

            <tbody>
              {players.map((player) => (
                <tr key={player.id}>
                  <td>{getPlayerName(player)}</td>
                  <td>{formatClass(player.classId)}</td>
                  <td>{formatWorld(player.world)}</td>
                  <td>{formatNumber(player.level)}</td>
                  <td>{formatNumber(player.gold)}</td>
                  <td>{formatNumber(player.power)}</td>
                  <td>{formatNumber(player.monsterKills)}</td>
                  <td>{formatNumber(player.petCount)}</td>
                  <td>{formatNumber(player.inventoryCount)}</td>
                </tr>
              ))}

              {!players.length && (
                <tr>
                  <td colSpan="9">No players found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, title, value, text }) {
  return (
    <div className="featureCard">
      <div className="featureIcon">{icon}</div>
      <h3>{title}</h3>
      <p>
        <strong>{value}</strong> {text}
      </p>
    </div>
  );
}

function LeaderCard({ title, player, valueLabel, value }) {
  return (
    <article className="wiki-card">
      <h3>{title}</h3>

      {player ? (
        <>
          <p>
            <strong>{getPlayerName(player)}</strong>
          </p>

          <div className="pill-row">
            <span className="pill">{formatClass(player.classId)}</span>
            <span className="pill">Lv. {formatNumber(player.level)}</span>
            <span className="pill">
              {valueLabel}: {formatNumber(value)}
            </span>
          </div>
        </>
      ) : (
        <p>No data yet.</p>
      )}
    </article>
  );
}