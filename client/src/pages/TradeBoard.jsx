import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Package,
  ShieldCheck,
  RefreshCcw,
  PlusCircle,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

import { API_URL, getAuthHeaders } from "../api/api";

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned invalid JSON.");
  }
}

function getDisplayName(user) {
  return (
    user?.globalName ||
    user?.global_name ||
    user?.displayName ||
    user?.username ||
    "Discord User"
  );
}

function formatGold(value) {
  return Number(value || 0).toLocaleString();
}

function formatDate(value) {
  if (!value) return "Unknown date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleString();
}

function formatStats(stats = {}) {
  const parts = [];

  if (stats.attack) parts.push(`ATK +${stats.attack}`);
  if (stats.defense) parts.push(`DEF +${stats.defense}`);
  if (stats.maxHp) parts.push(`HP +${stats.maxHp}`);
  if (stats.dodge) parts.push(`Dodge +${stats.dodge}%`);
  if (stats.crit) parts.push(`Crit +${stats.crit}%`);

  return parts.length ? parts : ["No bonus stats"];
}

async function fetchAuthData() {
  const response = await fetch(`${API_URL}/api/auth/me?t=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await readJsonResponse(response);

  if (!response.ok || !data.loggedIn || !data.user?.id) {
    return null;
  }

  return data.user;
}

async function fetchTradeInventoryData() {
  const response = await fetch(
    `${API_URL}/api/trades/my-inventory?t=${Date.now()}`,
    {
      credentials: "include",
      cache: "no-store",
      headers: getAuthHeaders(),
    }
  );

  const data = await readJsonResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to load your tradeable inventory.");
  }

  return Array.isArray(data.items) ? data.items : [];
}

async function fetchTradesData() {
  const response = await fetch(`${API_URL}/api/trades?t=${Date.now()}`, {
    credentials: "include",
    cache: "no-store",
  });

  const data = await readJsonResponse(response);

  if (!response.ok || !data.ok) {
    throw new Error(data.error || "Failed to load trade listings.");
  }

  return Array.isArray(data.trades) ? data.trades : [];
}

export default function TradeBoard() {
  const [user, setUser] = useState(null);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [trades, setTrades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState("");

  const [error, setError] = useState("");
  const [inventoryError, setInventoryError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const [selectedInventoryItemKey, setSelectedInventoryItemKey] = useState("");
  const [askingGold, setAskingGold] = useState("");
  const [note, setNote] = useState("");

  const selectedItem = useMemo(() => {
    return (
      inventoryItems.find(
        (item) => item.inventoryItemKey === selectedInventoryItemKey
      ) || null
    );
  }, [inventoryItems, selectedInventoryItemKey]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialData() {
      try {
        const [authResult, tradesResult] = await Promise.allSettled([
          fetchAuthData(),
          fetchTradesData(),
        ]);

        if (cancelled) return;

        const nextUser =
          authResult.status === "fulfilled" ? authResult.value : null;

        setUser(nextUser);

        if (tradesResult.status === "fulfilled") {
          setTrades(tradesResult.value);
          setError("");
        } else {
          setTrades([]);
          setError(
            tradesResult.reason?.message || "Failed to load trade listings."
          );
        }

        if (!nextUser?.id) {
          setInventoryItems([]);
          setInventoryError("");
          return;
        }

        const inventoryResult = await Promise.allSettled([
          fetchTradeInventoryData(),
        ]);

        if (cancelled) return;

        const result = inventoryResult[0];

        if (result.status === "fulfilled") {
          setInventoryItems(result.value);
          setInventoryError("");
        } else {
          setInventoryItems([]);
          setInventoryError(
            result.reason?.message || "Failed to load your tradeable inventory."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInventoryLoading(false);
        }
      }
    }

    void loadInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshAll() {
    try {
      setLoading(true);
      setInventoryLoading(true);
      setError("");
      setInventoryError("");
      setFormError("");
      setSuccess("");

      const [authResult, tradesResult] = await Promise.allSettled([
        fetchAuthData(),
        fetchTradesData(),
      ]);

      const nextUser =
        authResult.status === "fulfilled" ? authResult.value : null;

      setUser(nextUser);

      if (tradesResult.status === "fulfilled") {
        setTrades(tradesResult.value);
      } else {
        setTrades([]);
        setError(
          tradesResult.reason?.message || "Failed to load trade listings."
        );
      }

      if (!nextUser?.id) {
        setInventoryItems([]);
        return;
      }

      const inventoryItemsData = await fetchTradeInventoryData();
      setInventoryItems(inventoryItemsData);
    } catch (err) {
      setInventoryItems([]);
      setInventoryError(
        err.message || "Failed to load your tradeable inventory."
      );
    } finally {
      setLoading(false);
      setInventoryLoading(false);
    }
  }

  async function loadTradesOnly() {
    try {
      setLoading(true);
      setError("");

      const nextTrades = await fetchTradesData();
      setTrades(nextTrades);
    } catch (err) {
      setTrades([]);
      setError(err.message || "Failed to load trade listings.");
    } finally {
      setLoading(false);
    }
  }

  async function loadInventoryOnly() {
    if (!user?.id) {
      setInventoryItems([]);
      return;
    }

    try {
      setInventoryLoading(true);
      setInventoryError("");

      const nextInventoryItems = await fetchTradeInventoryData();
      setInventoryItems(nextInventoryItems);
    } catch (err) {
      setInventoryItems([]);
      setInventoryError(
        err.message || "Failed to load your tradeable inventory."
      );
    } finally {
      setInventoryLoading(false);
    }
  }

  async function handleCreateTrade(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setFormError("");
      setSuccess("");

      if (!user?.id) {
        throw new Error("You must login with Discord before posting a trade.");
      }

      if (!selectedItem?.inventoryItemKey) {
        throw new Error("Please select an item from your inventory.");
      }

      const goldValue = Number(askingGold || 0);

      if (!Number.isFinite(goldValue) || goldValue <= 0) {
        throw new Error("Asking gold must be greater than 0.");
      }

      const response = await fetch(`${API_URL}/api/trades`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          inventoryItemKey: selectedItem.inventoryItemKey,
          askingGold: goldValue,
          note,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to create trade listing.");
      }

      setSelectedInventoryItemKey("");
      setAskingGold("");
      setNote("");
      setSuccess("Trade listing posted.");

      await Promise.allSettled([loadTradesOnly(), loadInventoryOnly()]);
    } catch (err) {
      setFormError(err.message || "Failed to create trade listing.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancelTrade(tradeId) {
    try {
      setCancellingId(tradeId);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/api/trades/${tradeId}/cancel`, {
        method: "PATCH",
        credentials: "include",
        cache: "no-store",
        headers: getAuthHeaders(),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to cancel trade listing.");
      }

      setSuccess("Trade listing cancelled.");

      await Promise.allSettled([loadTradesOnly(), loadInventoryOnly()]);
    } catch (err) {
      setError(err.message || "Failed to cancel trade listing.");
    } finally {
      setCancellingId("");
    }
  }

  return (
    <section className="page">
      <div className="sectionHeader">
        <p className="eyebrow">SYXTH Market</p>
        <h1>Trade Board</h1>
        <p>Post and view player trade listings based on owned inventory items.</p>
      </div>

      <div className="grid-2">
        <div className="page-card">
          <h2>
            <Coins size={22} /> Inventory-Based Trading
          </h2>
          <p>
            Players can only list items that exist in their own inventory. The
            backend verifies ownership before creating a listing.
          </p>
        </div>

        <div className="page-card">
          <h2>
            <ShieldCheck size={22} /> Safe Listing
          </h2>
          <p>
            Listed items are trade-locked until the seller cancels the listing.
            Buying and item transfer should be added later with transaction
            validation.
          </p>
        </div>
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>
              <PlusCircle size={22} /> Create Trade Listing
            </h2>

            <p className="muted-text">
              {user
                ? `Posting as ${getDisplayName(user)}`
                : "Login required to post a trade."}
            </p>
          </div>

          <button
            type="button"
            className="secondaryBtn smallBtn"
            onClick={refreshAll}
            disabled={loading || inventoryLoading}
          >
            <RefreshCcw size={16} />
            Refresh
          </button>
        </div>

        {!user && (
          <div className="warning-box">
            Login with Discord before creating a trade listing.
            <Link to="/login" className="textLink">
              Login here
            </Link>
          </div>
        )}

        {inventoryError && <div className="errorBox">{inventoryError}</div>}

        {user && !inventoryLoading && !inventoryItems.length && (
          <div className="empty-state">
            No tradeable inventory items found. Locked, equipped, or already
            listed items cannot be posted.
          </div>
        )}

        <form className="trade-form" onSubmit={handleCreateTrade}>
          <div className="form-grid">
            <label className="form-field">
              <span>Your Inventory Item</span>
              <select
                value={selectedInventoryItemKey}
                onChange={(event) =>
                  setSelectedInventoryItemKey(event.target.value)
                }
                disabled={!user || inventoryLoading || submitting}
              >
                <option value="">
                  {inventoryLoading
                    ? "Loading your inventory..."
                    : "Select owned item"}
                </option>

                {inventoryItems.map((item) => (
                  <option
                    value={item.inventoryItemKey}
                    key={item.inventoryItemKey}
                  >
                    {item.itemEmoji || "📦"} {item.itemName} —{" "}
                    {item.itemQuality} Lv.{item.requiredLevel}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Asking Gold</span>
              <input
                type="number"
                min="1"
                value={askingGold}
                onChange={(event) => setAskingGold(event.target.value)}
                placeholder="Example: 5000"
                disabled={!user || submitting}
              />
            </label>
          </div>

          {selectedItem && (
            <div className="selected-trade-item">
              <h3>
                {selectedItem.itemEmoji || "📦"} {selectedItem.itemName}
              </h3>

              <p>
                {selectedItem.itemQuality} • {selectedItem.itemType} • Lv.
                {selectedItem.requiredLevel}
              </p>

              <div className="stat-list">
                {formatStats(selectedItem.stats).map((stat) => (
                  <span key={stat}>{stat}</span>
                ))}
              </div>
            </div>
          )}

          <label className="form-field">
            <span>Note</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Example: Selling for gold only."
              rows={3}
              disabled={!user || submitting}
            />
          </label>

          {formError && <div className="errorBox">{formError}</div>}
          {success && <div className="successBox">{success}</div>}

          <button
            type="submit"
            className="primaryBtn"
            disabled={!user || submitting || !selectedItem}
          >
            {submitting ? "Posting..." : "Post Trade Listing"}
          </button>
        </form>
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>
              <Package size={22} /> Active Listings
            </h2>

            <p className="muted-text">
              {loading
                ? "Loading trade listings..."
                : `${trades.length} active listing${
                    trades.length === 1 ? "" : "s"
                  }`}
            </p>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading trade board...</div>
        ) : (
          <div className="wiki-grid">
            {trades.map((trade) => {
              const isOwnTrade = user?.id && trade.sellerId === user.id;

              return (
                <article className="wiki-card trade-card" key={trade.id}>
                  <div className="wiki-card-head">
                    <span className="wiki-icon">
                      <Package size={22} />
                    </span>

                    <div>
                      <h3>
                        {trade.itemEmoji || "📦"} {trade.itemName}
                      </h3>

                      <p>
                        {trade.itemQuality || "Common"} •{" "}
                        {trade.itemType || "Item"} • Seller: {trade.sellerName}
                      </p>
                    </div>
                  </div>

                  <div className="price-row">
                    <Coins size={16} />
                    <span>{formatGold(trade.askingGold)} gold</span>
                  </div>

                  {trade.note && <p>{trade.note}</p>}

                  <div className="pill-row">
                    <span className="pill">{trade.status}</span>
                    <span className="pill">{formatDate(trade.createdAt)}</span>
                  </div>

                  {isOwnTrade && (
                    <button
                      type="button"
                      className="dangerBtn"
                      onClick={() => handleCancelTrade(trade.id)}
                      disabled={cancellingId === trade.id}
                    >
                      <XCircle size={16} />
                      {cancellingId === trade.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </article>
              );
            })}

            {!trades.length && (
              <div className="empty-state">No active trade listings yet.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}