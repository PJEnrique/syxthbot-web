import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Sword, Menu } from "lucide-react";
import {
  API_URL,
  consumeAuthTokenFromUrl,
  getStoredAuthToken,
  clearStoredAuthToken,
} from "../api/api";

async function fetchAuthStatus(signal) {
  const token = getStoredAuthToken();

  const options = {
    credentials: "include",
    cache: "no-store",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };

  if (signal) {
    options.signal = signal;
  }

  const response = await fetch(`${API_URL}/api/auth/me?t=${Date.now()}`, options);

  if (!response.ok) {
    return {
      loggedIn: false,
      user: null,
    };
  }

  const data = await response.json();

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

function getInitial(user) {
  return String(getDisplayName(user)).charAt(0).toUpperCase();
}

export default function Navbar() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    consumeAuthTokenFromUrl();

    const controller = new AbortController();
    let cancelled = false;

    function checkAuth(signal) {
      fetchAuthStatus(signal)
        .then((result) => {
          if (cancelled) return;
          setUser(result.loggedIn ? result.user : null);
        })
        .catch((err) => {
          if (cancelled || err.name === "AbortError") return;
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

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const token = getStoredAuthToken();

      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      clearStoredAuthToken();
      setUser(null);

      localStorage.setItem("syxth-auth-event", String(Date.now()));
      window.dispatchEvent(new Event("syxth-auth-changed"));

      window.location.replace("/");
    } catch (error) {
      console.error("Logout failed:", error);
      clearStoredAuthToken();
      setUser(null);
      setLoggingOut(false);
    }
  }

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <div className="brandIcon">
          <Sword size={22} />
        </div>

        <div>
          <strong>SYXTH</strong>
          <span>MMORPG</span>
        </div>
      </Link>

      <nav className="navLinks">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
        <NavLink to="/petdex">PetDex</NavLink>
        <NavLink to="/boss">Boss</NavLink>
        <NavLink to="/guide">Guide</NavLink>
        <NavLink to="/items">Item Wiki</NavLink>
        <NavLink to="/trades">Trade Board</NavLink>
        <NavLink to="/admin">Admin Panel</NavLink>
        <NavLink to="/patch-notes">Patch Notes</NavLink>
      </nav>

      <div className="navAuth">
        {authLoading ? (
          <span className="authLoading">Checking...</span>
        ) : user ? (
          <>
            <Link to="/dashboard" className="userBadge">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={getDisplayName(user)} />
              ) : (
                <span>{getInitial(user)}</span>
              )}

              <strong>{getDisplayName(user)}</strong>
            </Link>

            <button
              type="button"
              className="logoutBtn"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          </>
        ) : (
          <Link to="/login" className="loginBtn">
            Discord Login
          </Link>
        )}
      </div>

      <button className="menuBtn" type="button" aria-label="Menu">
        <Menu size={22} />
      </button>
    </header>
  );
}