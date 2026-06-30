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
  Eye,
  X,
  Backpack,
  Swords,
  Heart,
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

function formatDate(value) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return toDisplayText(value, "Not recorded");
  }

  return date.toLocaleString();
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

async function fetchPlayerDetails(playerId) {
  const response = await fetch(
    `${API_URL}/api/admin/players/${encodeURIComponent(playerId)}?t=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
      headers: getAuthHeaders(),
    }
  );

  const data = await readJsonResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to inspect player.");
  }

  return data.player || null;
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

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const [inspectorError, setInspectorError] = useState("");

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

  async function handleInspectPlayer(playerId) {
    try {
      setInspectorLoading(true);
      setInspectorError("");
      setSelectedPlayer(null);

      const player = await fetchPlayerDetails(playerId);

      setSelectedPlayer(player);
    } catch (err) {
      setInspectorError(err.message || "Failed to inspect player.");
    } finally {
      setInspectorLoading(false);
    }
  }

  function closeInspector() {
    setSelectedPlayer(null);
    setInspectorError("");
    setInspectorLoading(false);
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
          <p>This page is restricted to allowed Discord admin roles.</p>
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
            onInspect={handleInspectPlayer}
          />

          <LeaderCard
            title="Richest Player"
            player={overview?.richestPlayer}
            valueLabel="Gold"
            value={overview?.richestPlayer?.gold}
            onInspect={handleInspectPlayer}
          />

          <LeaderCard
            title="Top Killer"
            player={overview?.topKiller}
            valueLabel="Kills"
            value={overview?.topKiller?.monsterKills}
            onInspect={handleInspectPlayer}
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
                  <th>Action</th>
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
                    <td>
                      <button
                        type="button"
                        className="secondaryBtn smallBtn"
                        onClick={() => handleInspectPlayer(player.id)}
                        disabled={inspectorLoading}
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}

                {!topPlayers.length && (
                  <tr>
                    <td colSpan="8">No ranked players found.</td>
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
                <th>Action</th>
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
                  <td>
                    <button
                      type="button"
                      className="secondaryBtn smallBtn"
                      onClick={() => handleInspectPlayer(player.id)}
                      disabled={inspectorLoading}
                    >
                      <Eye size={15} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {!players.length && (
                <tr>
                  <td colSpan="10">No players found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(inspectorLoading || inspectorError || selectedPlayer) && (
        <PlayerInspectorModal
          loading={inspectorLoading}
          error={inspectorError}
          player={selectedPlayer}
          onClose={closeInspector}
        />
      )}
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

function LeaderCard({ title, player, valueLabel, value, onInspect }) {
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

          <button
            type="button"
            className="secondaryBtn smallBtn"
            onClick={() => onInspect?.(player.id)}
          >
            <Eye size={15} />
            View Details
          </button>
        </>
      ) : (
        <p>No data yet.</p>
      )}
    </article>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="statRow">
      <span>{label}</span>
      <strong>{toDisplayText(value, "Not recorded")}</strong>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <span className="pill">
      {label}: <strong>{formatNumber(value)}</strong>
    </span>
  );
}

function PlayerInspectorModal({ loading, error, player, onClose }) {
  const equipment = player?.equipment || {};
  const inventory = Array.isArray(player?.inventory) ? player.inventory : [];
  const pets = Array.isArray(player?.pets) ? player.pets : [];

  return (
    <div className="admin-inspector-backdrop" role="presentation">
      <div className="admin-inspector-modal">
        <div className="filter-head">
          <div>
            <p className="eyebrow">Player Inspector</p>
            <h2>{player ? getPlayerName(player) : "Loading Player"}</h2>
            <p className="muted-text">
              Read-only player profile. No database editing is enabled.
            </p>
          </div>

          <button type="button" className="secondaryBtn smallBtn" onClick={onClose}>
            <X size={16} />
            Close
          </button>
        </div>

        {loading && <div className="empty-state">Loading player details...</div>}

        {error && (
          <div className="warning-box">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {!loading && !error && player && (
          <>
            <div className="featureGrid">
              <StatCard
                icon={<Trophy size={22} />}
                title="Level"
                value={formatNumber(player.level)}
                text="current level"
              />

              <StatCard
                icon={<Coins size={22} />}
                title="Gold"
                value={formatNumber(player.gold)}
                text="player balance"
              />

              <StatCard
                icon={<Swords size={22} />}
                title="Power"
                value={formatNumber(player.power)}
                text="combat rating"
              />

              <StatCard
                icon={<Heart size={22} />}
                title="HP"
                value={`${formatNumber(player.hp)} / ${formatNumber(player.maxHp)}`}
                text="current health"
              />
            </div>

            <div className="grid-2">
              <div className="page-card">
                <h3>
                  <Shield size={20} /> Identity
                </h3>

                <DetailRow label="Player ID" value={player.id} />
                <DetailRow label="User ID" value={player.userId} />
                <DetailRow label="Username" value={player.username} />
                <DetailRow label="Rank" value={player.rank} />
                <DetailRow label="Class" value={player.className || player.classId} />
                <DetailRow label="World" value={player.worldName || player.world} />
                <DetailRow label="Created" value={formatDate(player.createdAt)} />
                <DetailRow label="Updated" value={formatDate(player.updatedAt)} />
              </div>

              <div className="page-card">
                <h3>
                  <BarChart3 size={20} /> Combat Stats
                </h3>

                <div className="pill-row">
                  <StatPill label="ATK" value={player.attack} />
                  <StatPill label="DEF" value={player.defense} />
                  <StatPill label="HP" value={player.maxHp} />
                  <StatPill label="Dodge" value={player.dodge} />
                  <StatPill label="Crit" value={player.crit} />
                  <StatPill label="Kills" value={player.monsterKills} />
                  <StatPill label="Boss Damage" value={player.totalBossDamage || player.bossDamage} />
                  <StatPill label="Retreats" value={player.retreats} />
                </div>
              </div>
            </div>

            <div className="page-card">
              <h3>
                <Package size={20} /> Equipment
              </h3>

              <div className="equipment-grid">
                {["weapon", "helmet", "armor", "gloves", "pants", "boots"].map(
                  (slot) => {
                    const item = equipment?.[slot];

                    return (
                      <div className="equipment-slot" key={slot}>
                        <span className="slot-label">{formatClass(slot)}</span>

                        {item ? (
                          <>
                            <strong>{item.name || "Unknown Item"}</strong>
                            <small>
                              {item.quality || "Common"} • Lv.{" "}
                              {formatNumber(item.requiredLevel)}
                            </small>
                            <small>{item.description || "No description"}</small>
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
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="page-card">
                <h3>
                  <Backpack size={20} /> Inventory
                </h3>

                <p className="muted-text">
                  Total items: {formatNumber(inventory.length)}
                </p>

                <div className="pill-row">
                  {inventory.slice(0, 20).map((item) => (
                    <span className="pill" key={item.key || item.id || item.name}>
                      {item.name || "Unknown Item"} x{formatNumber(item.quantity)}
                    </span>
                  ))}

                  {!inventory.length && <span className="pill">No inventory items</span>}

                  {inventory.length > 20 && (
                    <span className="pill">
                      +{formatNumber(inventory.length - 20)} more
                    </span>
                  )}
                </div>
              </div>

              <div className="page-card">
                <h3>
                  <PawPrint size={20} /> Pets
                </h3>

                <p className="muted-text">Total pets: {formatNumber(pets.length)}</p>

                <div className="pill-row">
                  {pets.slice(0, 20).map((pet) => (
                    <span className="pill" key={pet.key || pet.id || pet.name}>
                      {pet.name || "Unknown Pet"} • Lv. {formatNumber(pet.level)}
                    </span>
                  ))}

                  {!pets.length && <span className="pill">No pets found</span>}

                  {pets.length > 20 && (
                    <span className="pill">+{formatNumber(pets.length - 20)} more</span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}