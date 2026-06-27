import { Link } from "react-router-dom";
import { getDiscordLoginUrl } from "../api/api";

export default function Login() {
  return (
    <section className="page narrowPage">
      <div className="panel centerPanel">
        <h1>Discord Login</h1>

        <p>
          Login with Discord to connect your SYXTH MMORPG character to the web dashboard.
        </p>

        <a href={getDiscordLoginUrl()} className="primaryBtn fullBtn activeLoginBtn">
          Login with Discord
        </a>

        <p className="muted">
          You must already have a character in Discord. Use <code>!s start</code> first.
        </p>

        <Link to="/" className="textLink">
          Back to Home
        </Link>
      </div>
    </section>
  );
}