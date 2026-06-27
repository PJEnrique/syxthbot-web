require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const playerRoutes = require("./routes/playerRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const petRoutes = require("./routes/petRoutes");
const bossRoutes = require("./routes/bossRoutes");
const itemRoutes = require("./routes/itemRoutes");
const tradeRoutes = require("./routes/tradeRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const SESSION_COOKIE_NAME = "syxth.sid";
const isProduction = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET || "change-this-secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

function noStore(req, res, next) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
}

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "SYXTH MMORPG Web API is running.",
  });
});

app.use("/api/auth", noStore, authRoutes);
app.use("/api/player", playerRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/pets", petRoutes);
app.use("/api/boss", bossRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: "Route not found.",
  });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err);

  res.status(500).json({
    ok: false,
    error: "Internal server error.",
  });
});

app.listen(PORT, () => {
  console.log(`SYXTH Web API running on http://localhost:${PORT}`);
});