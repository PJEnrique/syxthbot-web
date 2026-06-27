import { useMemo, useState } from "react";
import {
  ScrollText,
  ShieldCheck,
  Package,
  Wrench,
  Bug,
  Sparkles,
  CalendarDays,
  Tag,
} from "lucide-react";

const patchNotes = [
  {
    version: "v0.4.0",
    title: "Admin Panel Accuracy Update",
    date: "Latest",
    type: "System",
    summary:
      "Improved admin dashboard accuracy using normalized player data and safer display handling.",
    changes: [
      {
        label: "Improved",
        text: "Admin Panel now reads normalized player values for level, gold, power, class, kills, pets, and inventory.",
      },
      {
        label: "Fixed",
        text: "Fixed React crash when player world data is stored as an object instead of plain text.",
      },
      {
        label: "Added",
        text: "Added server leader cards for top power, richest player, and top killer.",
      },
      {
        label: "Added",
        text: "Added top player rankings by power, level, gold, kills, pets, and overall score.",
      },
    ],
  },
  {
    version: "v0.3.0",
    title: "Inventory-Based Trade Board",
    date: "Recent",
    type: "Trade",
    summary:
      "Trade listings now use actual player inventory items instead of manually selected Item Wiki data.",
    changes: [
      {
        label: "Added",
        text: "Players can only post items that exist in their own inventory.",
      },
      {
        label: "Improved",
        text: "Backend verifies item ownership before creating a trade listing.",
      },
      {
        label: "Added",
        text: "Listed items are trade-locked to prevent duplicate listings.",
      },
      {
        label: "Changed",
        text: "Cancelling a trade now unlocks the item and deletes the listing document.",
      },
    ],
  },
  {
    version: "v0.2.0",
    title: "Item Wiki Integration",
    date: "Recent",
    type: "Items",
    summary:
      "Added a searchable Item Wiki connected to the backend item data copied from the bot system.",
    changes: [
      {
        label: "Added",
        text: "Item Wiki page for weapons, gear, and consumables.",
      },
      {
        label: "Added",
        text: "Backend item route for loading generated class items and consumables.",
      },
      {
        label: "Improved",
        text: "Item filters for class, type, quality, level range, and search.",
      },
    ],
  },
  {
    version: "v0.1.0",
    title: "Web Dashboard Foundation",
    date: "Initial",
    type: "Core",
    summary:
      "Initial SYXTH MMORPG web dashboard setup with authentication and main navigation.",
    changes: [
      {
        label: "Added",
        text: "Discord login and logout flow.",
      },
      {
        label: "Fixed",
        text: "Resolved stale login state after logout.",
      },
      {
        label: "Added",
        text: "Dashboard, Leaderboard, PetDex, Boss, Guide, Item Wiki, Trade Board, Admin Panel, and Patch Notes navigation.",
      },
      {
        label: "Improved",
        text: "Cleaned landing and guide pages for better user flow.",
      },
    ],
  },
];

const typeOptions = ["All", "System", "Trade", "Items", "Core"];

function getTypeIcon(type) {
  if (type === "System") return <ShieldCheck size={18} />;
  if (type === "Trade") return <Wrench size={18} />;
  if (type === "Items") return <Package size={18} />;
  if (type === "Core") return <Sparkles size={18} />;

  return <ScrollText size={18} />;
}

function getChangeIcon(label) {
  if (label === "Fixed") return <Bug size={16} />;
  if (label === "Added") return <Sparkles size={16} />;
  if (label === "Changed") return <Wrench size={16} />;
  if (label === "Improved") return <ShieldCheck size={16} />;

  return <Tag size={16} />;
}

export default function PatchNotes() {
  const [selectedType, setSelectedType] = useState("All");

  const filteredPatchNotes = useMemo(() => {
    if (selectedType === "All") {
      return patchNotes;
    }

    return patchNotes.filter((patch) => patch.type === selectedType);
  }, [selectedType]);

  const latestPatch = patchNotes[0];

  return (
    <section className="page">
      <div className="sectionHeader">
        <p className="eyebrow">SYXTH Updates</p>
        <h1>Patch Notes</h1>
        <p>
          Track recent changes, fixes, system improvements, and upcoming
          development progress for the SYXTH MMORPG web dashboard.
        </p>
      </div>

      <div className="page-card patch-hero">
        <div>
          <p className="eyebrow">Latest Patch</p>
          <h2>
            <ScrollText size={24} /> {latestPatch.version} —{" "}
            {latestPatch.title}
          </h2>
          <p>{latestPatch.summary}</p>
        </div>

        <div className="patch-version-badge">
          <span>{latestPatch.version}</span>
          <small>{latestPatch.type}</small>
        </div>
      </div>

      <div className="page-card">
        <div className="filter-head">
          <div>
            <h2>
              <Tag size={22} /> Filter Updates
            </h2>
            <p className="muted-text">
              Showing {filteredPatchNotes.length} patch note
              {filteredPatchNotes.length === 1 ? "" : "s"}.
            </p>
          </div>
        </div>

        <div className="tab-row">
          {typeOptions.map((type) => (
            <button
              key={type}
              type="button"
              className={selectedType === type ? "tab-btn active" : "tab-btn"}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="patch-timeline">
        {filteredPatchNotes.map((patch) => (
          <article className="page-card patch-card" key={patch.version}>
            <div className="patch-card-head">
              <div className="patch-icon">{getTypeIcon(patch.type)}</div>

              <div>
                <div className="pill-row">
                  <span className="pill">{patch.version}</span>
                  <span className="pill">{patch.type}</span>
                  <span className="pill">
                    <CalendarDays size={14} /> {patch.date}
                  </span>
                </div>

                <h2>{patch.title}</h2>
                <p>{patch.summary}</p>
              </div>
            </div>

            <div className="patch-change-list">
              {patch.changes.map((change, index) => (
                <div className="patch-change" key={`${patch.version}-${index}`}>
                  <span className="patch-change-icon">
                    {getChangeIcon(change.label)}
                  </span>

                  <div>
                    <strong>{change.label}</strong>
                    <p>{change.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}

        {!filteredPatchNotes.length && (
          <div className="empty-state">No patch notes found.</div>
        )}
      </div>
    </section>
  );
}