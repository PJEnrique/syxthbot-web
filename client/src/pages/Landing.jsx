import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Crown,
  PawPrint,
  Swords,
  Trophy,
  Coins,
  Shield,
  MessageCircle,
} from "lucide-react";
import DiscordEmoji from "../components/DiscordEmoji";
import { API_URL, getAuthHeaders } from "../api/api";

const API_BASE = `${API_URL}/api`;
const DISCORD_INVITE_URL = "https://discord.gg/HVJ6wP5P5u";

const featuredPets = [
  {
    id: "forest_sprite",
    name: "Forest Sprite",
    emoji: "<:forest_sprite:1511976666988154990>",
    rarity: "Common",
    source: "Monster Pet Drop",
  },
  {
    id: "shadow_wolf",
    name: "Shadow Wolf",
    emoji: "<:shadow_wolf:1511977606155731025>",
    rarity: "Rare",
    source: "Boss Pet Drop",
  },
  {
    id: "phoenix_chick",
    name: "Phoenix Chick",
    emoji: "<:phoenix_chick:1511978110159945768>",
    rarity: "Legendary",
    source: "Boss Pet Drop",
  },
  {
    id: "ancient_dragonling",
    name: "Ancient Dragonling",
    emoji: "<:ancient_dragonling:1511977640821657630>",
    rarity: "Legendary",
    source: "Boss Pet Drop",
  },
];

async function fetchAuthStatus(signal) {
  const options = {
    credentials: "include",
    cache: "no-store",
    headers: getAuthHeaders(),
  };

  if (signal) {
    options.signal = signal;
  }

  const res = await fetch(`${API_BASE}/auth/me?t=${Date.now()}`, options);

  if (!res.ok) {
    return {
      loggedIn: false,
      user: null,
    };
  }

  const data = await res.json();

  const user =
    data.user ||
    data.discordUser ||
    data.me ||
    data.session?.user ||
    null;

  const hasRealUser = Boolean(user?.id);

  return {
    loggedIn: hasRealUser,
    user: hasRealUser ? user : null,
  };
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

export default function Landing() {
  const [authLoading, setAuthLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    function applyAuthResult(result) {
      if (cancelled) return;

      setLoggedIn(result.loggedIn);
      setUser(result.user);
    }

    function checkAuth(signal) {
      setAuthLoading(true);

      fetchAuthStatus(signal)
        .then(applyAuthResult)
        .catch((err) => {
          if (cancelled || err.name === "AbortError") return;

          setLoggedIn(false);
          setUser(null);
        })
        .finally(() => {
          if (!cancelled) {
            setAuthLoading(false);
          }
        });
    }

    function handleAuthChanged() {
      checkAuth();
    }

    function handleStorage(event) {
      if (event.key === "syxth-auth-event") {
        checkAuth();
      }
    }

    checkAuth(controller.signal);

    window.addEventListener("syxth-auth-changed", handleAuthChanged);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleAuthChanged);

    return () => {
      cancelled = true;
      controller.abort();

      window.removeEventListener("syxth-auth-changed", handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleAuthChanged);
    };
  }, []);

  return (
    <section className="page">
      <div className="hero">
        <div className="heroContent">
          <p className="eyebrow">Discord MMORPG Companion Website</p>

          <h1>
            Enter the World of <span>SYXTH MMORPG</span>
          </h1>

          <p className="heroText">
            Fight monsters, raid bosses, collect rare pets, trade with players,
            and climb the rankings. Everything starts inside Discord.
          </p>

          {loggedIn && user && (
            <p className="muted-text">
              Logged in as <strong>{getDisplayName(user)}</strong>
            </p>
          )}

          <div className="heroActions">
            {loggedIn ? (
              <Link to="/dashboard" className="primaryBtn">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="primaryBtn">
                {authLoading ? "Checking Login..." : "Login with Discord"}
              </Link>
            )}

            <a
              href={DISCORD_INVITE_URL}
              className="discordBtn"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              Join Discord Server
            </a>

            <Link to="/guide" className="secondaryBtn">
              View Game Guide
            </Link>
          </div>

          <div className="commandBox">
            Start your journey with <code>!s start</code>
          </div>
        </div>

        <div className="heroCard">
          <div className="bossPreview">
            <Crown size={40} />
            <h3>World Boss Raid</h3>
            <p>Chaos Titan</p>

            <div className="hpBar">
              <span style={{ width: "68%" }} />
            </div>

            <small>Scheduled boss raids run inside Discord.</small>
          </div>
        </div>
      </div>

      <div className="sectionHeader">
        <h2>Current Features</h2>
        <p>Core systems already active in the Discord game.</p>
      </div>

      <div className="featureGrid">
        <Feature
          icon={<Swords />}
          title="Monster Hunt"
          text="Fight enemies, earn EXP, gold, item drops, and pet drops."
        />

        <Feature
          icon={<Crown />}
          title="Boss Raids"
          text="Join world boss raids with damage rankings and boss rewards."
        />

        <Feature
          icon={<PawPrint />}
          title="Pet System"
          text="Collect pets with quality, stats, levels, locks, and active bonuses."
        />

        <Feature
          icon={<Coins />}
          title="Economy"
          text="Earn gold, buy shop items, sell loot, and trade with players."
        />

        <Feature
          icon={<Shield />}
          title="Equipment"
          text="Build your character through weapon, helmet, armor, gloves, pants, and boots."
        />

        <Feature
          icon={<Trophy />}
          title="Leaderboard"
          text="Compete through level, power, gold, kills, pets, and boss damage."
        />
      </div>

      <div className="sectionHeader">
        <h2>Pet Spoilers</h2>
        <p>
          Some pets already exist in the world. Others are waiting to be
          discovered.
        </p>
      </div>

      <div className="petGrid">
        {featuredPets.map((pet) => (
          <div className="petCard" key={pet.id}>
            <div className="petEmoji">
              <DiscordEmoji value={pet.emoji} size={44} />
            </div>

            <h3>{pet.name}</h3>
            <p>{pet.rarity}</p>
            <small>{pet.source}</small>
          </div>
        ))}
      </div>

      <div className="comingSoon">
        <h2>Coming Soon</h2>

        <div className="soonGrid">
          <span>📜 Daily Quests</span>
          <span>🏆 Achievements</span>
          <span>🏰 Dungeon Floors</span>
          <span>🍖 Pet Treats</span>
          <span>🔮 Pet Fusion</span>
          <span>🌐 World Events</span>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="featureCard">
      <div className="featureIcon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}