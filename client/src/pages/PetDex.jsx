import { useEffect, useMemo, useState } from "react";
import { PawPrint, RefreshCw } from "lucide-react";
import DiscordEmoji from "../components/DiscordEmoji";

const API_BASE = "http://localhost:5000/api";

const PET_EMOJI_MAP = {
  baby_wolf: "<:baby_wolf:1511976609597362296>",
  stone_turtle: "<:stone_turtle:1511976633186386010>",
  forest_sprite: "<:forest_sprite:1511976666988154990>",
  young_hawk: "<:young_hawk:1511976792267948074>",
  moon_rabbit: "<:moon_rabbit:1511976820625379329>",
  wild_boar: "<:wild_boar:1511976907590209656>",

  shadow_wolf: "<:shadow_wolf:1511977606155731025>",
  spirit_deer: "<:spirit_deer:1511977583095582720>",
  ironback_turtle: "<:ironback_turtle:1511977559229730896>",
  mystic_owl: "<:mystic_owl:1511977529630658690>",
  night_panther: "<:night_panther:1511977408423657513>",

  ember_drake: "<:ember_drake:1511978242939293826>",
  golden_lion: "<:golden_lion:1511978223729381376>",
  phoenix_chick: "<:phoenix_chick:1511978110159945768>",
  ancient_dragonling: "<:ancient_dragonling:1511977640821657630>",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "monster", label: "Monster Drops" },
  { id: "boss", label: "Boss Drops" },
  { id: "Common", label: "Common" },
  { id: "Rare", label: "Rare" },
  { id: "Legendary", label: "Legendary" },
  { id: "owned", label: "Owned" },
];

async function fetchPetDexData(signal) {
  const res = await fetch(`${API_BASE}/pets`, {
    signal,
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Failed to load PetDex.");
  }

  return data;
}

async function fetchPlayerPetsData(signal) {
  const res = await fetch(`${API_BASE}/pets/me`, {
    credentials: "include",
    signal,
  });

  const data = await res.json();

  if (!res.ok || !data.ok) {
    return {
      petdex: [],
      activePet: null,
    };
  }

  return data;
}

function getPetEmojiValue(pet = {}, displayPet = {}) {
  const directEmoji = displayPet.emoji || pet.emoji;

  if (directEmoji && directEmoji !== "🐾") {
    return directEmoji;
  }

  const basePetId = pet.basePetId || displayPet.basePetId || pet.id || displayPet.id;

  return PET_EMOJI_MAP[basePetId] || "🐾";
}

function StatLine({ stats }) {
  if (!stats) return null;

  return (
    <div className="pet-stat-list compact">
      <span>ATK {stats.attack}</span>
      <span>DEF {stats.defense}</span>
      <span>HP {stats.maxHp}</span>
      <span>Dodge {stats.dodge}%</span>
      <span>Crit {stats.crit}%</span>
    </div>
  );
}

export default function PetDex() {
  const [pets, setPets] = useState([]);
  const [playerPets, setPlayerPets] = useState([]);
  const [activePet, setActivePet] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [playerPetsLoading, setPlayerPetsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function refreshPetDex() {
    try {
      setRefreshing(true);
      setError("");

      const [petDexResult, playerPetsResult] = await Promise.allSettled([
        fetchPetDexData(),
        fetchPlayerPetsData(),
      ]);

      if (petDexResult.status === "fulfilled") {
        setPets(petDexResult.value.pets || []);
      } else {
        throw petDexResult.reason;
      }

      if (playerPetsResult.status === "fulfilled") {
        setPlayerPets(playerPetsResult.value.petdex || []);
        setActivePet(playerPetsResult.value.activePet || null);
      } else {
        setPlayerPets([]);
        setActivePet(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load PetDex.");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    Promise.allSettled([
      fetchPetDexData(controller.signal),
      fetchPlayerPetsData(controller.signal),
    ])
      .then(([petDexResult, playerPetsResult]) => {
        if (cancelled) return;

        if (petDexResult.status === "fulfilled") {
          setPets(petDexResult.value.pets || []);
          setError("");
        } else if (petDexResult.reason?.name !== "AbortError") {
          setError(petDexResult.reason?.message || "Failed to load PetDex.");
        }

        if (playerPetsResult.status === "fulfilled") {
          setPlayerPets(playerPetsResult.value.petdex || []);
          setActivePet(playerPetsResult.value.activePet || null);
        } else if (playerPetsResult.reason?.name !== "AbortError") {
          setPlayerPets([]);
          setActivePet(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setPlayerPetsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const mergedPets = useMemo(() => {
    if (playerPets.length) return playerPets;

    return pets.map((pet) => ({
      ...pet,
      owned: false,
      ownedCount: 0,
      active: false,
      bestOwned: null,
    }));
  }, [pets, playerPets]);

  const filteredPets = useMemo(() => {
    const term = search.toLowerCase().trim();

    return mergedPets.filter((pet) => {
      const matchesSearch =
        !term ||
        String(pet.name || "").toLowerCase().includes(term) ||
        String(pet.id || "").toLowerCase().includes(term) ||
        String(pet.type || "").toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (filter === "all") return true;
      if (filter === "owned") return pet.owned;
      if (filter === "monster") return pet.dropGroup === "monster";
      if (filter === "boss") return pet.dropGroup === "boss";

      return Array.isArray(pet.allowedQualities)
        ? pet.allowedQualities.includes(filter)
        : false;
    });
  }, [mergedPets, filter, search]);

  return (
    <main className="page">
      <section className="hero-card dashboard-hero">
        <div>
          <p className="eyebrow">SYXTH Companion</p>
          <h1>
            <PawPrint size={30} /> PetDex
          </h1>
          <p>View monster pets, boss pets, owned copies, and active pet status.</p>
        </div>

        <button
          className="ghost-btn"
          onClick={refreshPetDex}
          disabled={refreshing}
        >
          <RefreshCw size={16} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {activePet && (
        <section className="page-card">
          <h2>Current Active Pet</h2>
          <div className="active-pet-card">
            <div className="pet-emoji">
              <DiscordEmoji value={getPetEmojiValue(activePet, activePet)} size={38} />
            </div>

            <div>
              <h3>{activePet.name}</h3>
              <p>
                {activePet.qualityEmoji} {activePet.quality} •{" "}
                {String(activePet.type || "balanced").toUpperCase()} • Lv.
                {activePet.level}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="page-card">
        <div className="filter-head">
          <div className="tab-row">
            {FILTERS.map((entry) => (
              <button
                key={entry.id}
                className={filter === entry.id ? "tab-btn active" : "tab-btn"}
                onClick={() => setFilter(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <input
            className="search-input"
            placeholder="Search pets..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {loading && <p>Loading pets...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !error && (
          <>
            {playerPetsLoading && (
              <p className="muted-text">
                Checking owned pets from your account...
              </p>
            )}

            <div className="pet-grid">
              {filteredPets.length ? (
                filteredPets.map((pet) => {
                  const displayPet = pet.bestOwned || pet;
                  const stats =
                    pet.bestOwned?.calculatedStats ||
                    pet.baseStats ||
                    displayPet.stats;

                  return (
                    <article
                      className={pet.owned ? "pet-card owned" : "pet-card"}
                      key={pet.id}
                    >
                      <div className="pet-card-top">
                        <div className="pet-emoji">
                          <DiscordEmoji
                            value={getPetEmojiValue(pet, displayPet)}
                            size={38}
                          />
                        </div>

                        <div>
                          <h3>{pet.name}</h3>
                          <p>{String(pet.type || "balanced").toUpperCase()}</p>
                        </div>
                      </div>

                      <div className="pill-row">
                        <span className="pill">{pet.dropGroup} drop</span>
                        {(pet.allowedQualities || []).map((quality) => (
                          <span className="pill" key={quality}>
                            {quality}
                          </span>
                        ))}
                      </div>

                      <p>Required Level: {pet.requiredLevel}</p>
                      <StatLine stats={stats} />

                      {pet.owned ? (
                        <div className="owned-box">
                          <strong>{pet.active ? "Active" : "Owned"}</strong>
                          <span>
                            Copies: {pet.ownedCount} • Best Lv.
                            {pet.bestOwned?.level || 1}
                          </span>
                        </div>
                      ) : (
                        <div className="locked-box">Not owned</div>
                      )}
                    </article>
                  );
                })
              ) : (
                <p>No pets matched your filter.</p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}