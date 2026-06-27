import {
  BookOpen,
  Swords,
  Crown,
  PawPrint,
  Shield,
  Coins,
  Trophy,
  HeartPulse,
} from "lucide-react";

const guideSections = [
  {
    icon: <BookOpen size={22} />,
    title: "How to Start",
    text: "Join the Discord server first, then use !s start to create your SYXTH character. After your character is created, your web dashboard can read your player data.",
    commands: ["!s start", "!s profile", "!s help"],
  },
  {
    icon: <Swords size={22} />,
    title: "Hunting Monsters",
    text: "Use hunt commands to fight monsters, earn EXP, gold, item drops, and possible common pet drops. Hunting is one of the main ways to level up.",
    commands: ["!s hunt", "!s rest", "!s inventory"],
  },
  {
    icon: <HeartPulse size={22} />,
    title: "HP, Rest, and Revive",
    text: "If your HP becomes low, rest before fighting again. If your character is defeated, wait for the revive timer or follow the revive instruction shown in Discord.",
    commands: ["!s rest", "!s profile"],
  },
  {
    icon: <Shield size={22} />,
    title: "Equipment System",
    text: "Your character can equip gear in different slots: weapon, helmet, armor, gloves, pants, and boots. Better equipment increases your combat stats and total power.",
    commands: ["!s equip", "!s unequip", "!s inventory"],
  },
  {
    icon: <PawPrint size={22} />,
    title: "Pet System",
    text: "Pets can be collected, leveled, locked, and activated. An active pet adds bonus stats to your character. Common pets come from monsters, while rare and legendary pets come from boss rewards.",
    commands: ["!s pet", "!s pets"],
  },
  {
    icon: <Crown size={22} />,
    title: "Boss Raids",
    text: "World bosses spawn on a schedule. Join raids, deal damage, and compete in damage rankings. Higher contribution may improve your reward results.",
    commands: ["!s raid", "!s hit"],
  },
  {
    icon: <Coins size={22} />,
    title: "Gold and Trading",
    text: "Gold is used for buying items, trading, and improving your progress. You can sell loot or trade with other players through the Discord game system.",
    commands: ["!s shop", "!s buy", "!s sell", "!s trade"],
  },
  {
    icon: <Trophy size={22} />,
    title: "Leaderboard",
    text: "Players can compete through level, power, gold, monster kills, pets owned, and boss damage. The website leaderboard reads player rankings from the game database.",
    commands: ["!s leaderboard", "!s flex"],
  },
];

export default function Guide() {
  return (
    <section className="page">
      <div className="sectionHeader">
        <p className="eyebrow">SYXTH Player Manual</p>
        <h1>Game Guide</h1>
        <p>Basic guide for new SYXTH MMORPG players.</p>
      </div>

      <div className="commandBox">
        Main starter command: <code>!s start</code>
      </div>

      <div className="guideList">
        {guideSections.map((section) => (
          <div className="panel guideCard" key={section.title}>
            <div className="guideCardHead">
              <span className="guideIcon">{section.icon}</span>
              <h2>{section.title}</h2>
            </div>

            <p>{section.text}</p>

            <div className="commandList">
              {section.commands.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}