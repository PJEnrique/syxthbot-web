import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Package,
  Sword,
  Shield,
  HeartPulse,
  Coins,
  RefreshCcw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const typeFilters = [
  "All",
  "Weapon",
  "Helmet",
  "Armor",
  "Gloves",
  "Pants",
  "Boots",
  "Consumable",
];

const classFilters = ["All", "Swordsman", "Archer", "Assassin", "Tanker"];

const qualityFilters = ["All", "Common", "Rare", "Legendary"];

function getIcon(type) {
  const normalizedType = String(type || "").toLowerCase();

  if (normalizedType === "weapon") return <Sword size={22} />;

  if (
    normalizedType === "helmet" ||
    normalizedType === "armor" ||
    normalizedType === "gloves" ||
    normalizedType === "pants" ||
    normalizedType === "boots"
  ) {
    return <Shield size={22} />;
  }

  if (normalizedType === "consumable") return <HeartPulse size={22} />;

  return <Package size={22} />;
}

function formatClassName(value) {
  return String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatSource(value) {
  return String(value || "unknown")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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

async function readJsonResponse(response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Server returned invalid JSON.");
  }
}

export default function ItemWiki() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [classFilter, setClassFilter] = useState("All");
  const [qualityFilter, setQualityFilter] = useState("All");

  async function loadItems() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/items?t=${Date.now()}`, {
        credentials: "include",
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to load items.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setMeta(data.meta || null);
    } catch (err) {
      setError(err.message || "Failed to load items.");
      setItems([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/items?t=${Date.now()}`, {
          credentials: "include",
          cache: "no-store",
        });

        const data = await readJsonResponse(response);

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Failed to load items.");
        }

        if (!cancelled) {
          setItems(Array.isArray(data.items) ? data.items : []);
          setMeta(data.meta || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load items.");
          setItems([]);
          setMeta(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredItems = useMemo(() => {
    const term = search.toLowerCase().trim();
    const selectedType = typeFilter.toLowerCase();
    const selectedClass = classFilter.toLowerCase();
    const selectedQuality = qualityFilter.toLowerCase();

    return items
      .filter((item) => {
        const type = String(item.type || "").toLowerCase();
        const slot = String(item.slot || "").toLowerCase();
        const quality = String(item.quality || "").toLowerCase();

        const classes = Array.isArray(item.compatibleClasses)
          ? item.compatibleClasses.map((entry) => String(entry).toLowerCase())
          : [];

        const matchesType =
          selectedType === "all" ||
          type === selectedType ||
          slot === selectedType;

        const matchesClass =
          selectedClass === "all" ||
          classes.includes("all") ||
          classes.includes(selectedClass);

        const matchesQuality =
          selectedQuality === "all" || quality === selectedQuality;

        const haystack = [
          item.name,
          item.id,
          item.type,
          item.slot,
          item.quality,
          item.description,
          item.source,
          ...(item.compatibleClasses || []),
        ]
          .join(" ")
          .toLowerCase();

        const matchesSearch = !term || haystack.includes(term);

        return matchesType && matchesClass && matchesQuality && matchesSearch;
      })
      .sort((a, b) => {
        const levelA = Number(a.requiredLevel || 1);
        const levelB = Number(b.requiredLevel || 1);

        if (levelA !== levelB) return levelA - levelB;

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [items, search, typeFilter, classFilter, qualityFilter]);

  return (
    <section className="page">
      <div className="sectionHeader">
        <p className="eyebrow">SYXTH Database</p>
        <h1>Item Wiki</h1>
        <p>
          Browse weapons, armor, consumables, level requirements, item prices,
          and item stats.
        </p>
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>Items</h2>
            <p className="muted-text">
              {loading
                ? "Loading item data..."
                : `${filteredItems.length} of ${items.length} items shown`}
            </p>
          </div>

          <div className="search-box">
            <Search size={18} />
            <input
              className="search-input flat"
              placeholder="Search item name, class, quality..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="tab-row">
          {typeFilters.map((entry) => (
            <button
              key={entry}
              type="button"
              className={typeFilter === entry ? "tab-btn active" : "tab-btn"}
              onClick={() => setTypeFilter(entry)}
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="tab-row">
          {classFilters.map((entry) => (
            <button
              key={entry}
              type="button"
              className={classFilter === entry ? "tab-btn active" : "tab-btn"}
              onClick={() => setClassFilter(entry)}
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="tab-row">
          {qualityFilters.map((entry) => (
            <button
              key={entry}
              type="button"
              className={qualityFilter === entry ? "tab-btn active" : "tab-btn"}
              onClick={() => setQualityFilter(entry)}
            >
              {entry}
            </button>
          ))}
        </div>

        <div className="item-toolbar">
          <button
            type="button"
            className="secondaryBtn smallBtn"
            onClick={loadItems}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            {loading ? "Refreshing..." : "Refresh Items"}
          </button>

          {meta && (
            <p className="muted-text">
              Database loaded: {meta.total} total items.
            </p>
          )}
        </div>

        {error && <div className="errorBox">{error}</div>}

        {loading ? (
          <div className="empty-state">Loading item wiki...</div>
        ) : (
          <div className="wiki-grid">
            {filteredItems.map((item) => (
              <article className="wiki-card" key={item.id}>
                <div className="wiki-card-head">
                  <span className="wiki-icon">{getIcon(item.type)}</span>

                  <div>
                    <h3>
                      <span>{item.emoji || "📦"}</span> {item.name}
                    </h3>

                    <p>
                      {item.qualityEmoji || "🟢"} {item.quality} • {item.type}
                    </p>
                  </div>
                </div>

                <p>{item.description}</p>

                <div className="pill-row">
                  <span className="pill">Lv. {item.requiredLevel}</span>
                  <span className="pill">{formatSource(item.source)}</span>

                  {Array.isArray(item.compatibleClasses) &&
                    item.compatibleClasses.map((className) => (
                      <span className="pill" key={className}>
                        {formatClassName(className)}
                      </span>
                    ))}
                </div>

                <div className="stat-list">
                  {formatStats(item.stats).map((stat) => (
                    <span key={stat}>{stat}</span>
                  ))}
                </div>

                <div className="price-row">
                  <Coins size={16} />
                  <span>{Number(item.price || 0).toLocaleString()} gold</span>
                </div>
              </article>
            ))}

            {!filteredItems.length && (
              <div className="empty-state">No items matched your filters.</div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}