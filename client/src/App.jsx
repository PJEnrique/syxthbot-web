import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import PetDex from "./pages/PetDex";
import BossStatus from "./pages/BossStatus";
import Guide from "./pages/Guide";
import ItemWiki from "./pages/ItemWiki";
import TradeBoard from "./pages/TradeBoard";
import AdminPanel from "./pages/AdminPanel";
import PatchNotes from "./pages/PatchNotes";

export default function App() {
  return (
    <div className="app">
      <Navbar />

      <main className="main">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/petdex" element={<PetDex />} />
          <Route path="/boss" element={<BossStatus />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/items" element={<ItemWiki />} />
          <Route path="/trades" element={<TradeBoard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/patch-notes" element={<PatchNotes />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}