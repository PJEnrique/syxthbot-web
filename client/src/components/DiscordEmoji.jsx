function parseDiscordEmoji(value) {
  const text = String(value || "");

  const match = text.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);

  if (!match) {
    return null;
  }

  const isAnimated = text.startsWith("<a:");
  const name = match[1];
  const id = match[2];

  return {
    name,
    id,
    url: `https://cdn.discordapp.com/emojis/${id}.${
      isAnimated ? "gif" : "png"
    }?size=64&quality=lossless`,
  };
}

export default function DiscordEmoji({ value, size = 32, className = "" }) {
  const emoji = parseDiscordEmoji(value);

  if (!emoji) {
    return <span className={className}>{value || "🐾"}</span>;
  }

  return (
    <img
      src={emoji.url}
      alt={emoji.name}
      title={emoji.name}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        verticalAlign: "middle",
      }}
    />
  );
}