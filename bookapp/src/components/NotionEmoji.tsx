import React from "react";

/**
 * Maps common emoji characters to their Noto Color Emoji SVG on Google's CDN.
 * This gives a Notion-like consistent, polished emoji look across all platforms.
 */
const emojiCodeMap: Record<string, string> = {
  "📚": "1f4da",
  "📖": "1f4d6",
  "📕": "1f4d5",
  "📗": "1f4d7",
  "📘": "1f4d8",
  "📙": "1f4d9",
  "✨": "2728",
  "⚡": "26a1",
  "🌙": "1f319",
  "🧭": "1f9ed",
  "🎨": "1f3a8",
  "❤️": "2764-fe0f",
  "🔥": "1f525",
  "⭐": "2b50",
  "💡": "1f4a1",
  "🎯": "1f3af",
  "🧠": "1f9e0",
  "💬": "1f4ac",
  "🌟": "1f31f",
  "👏": "1f44f",
  "✓": "2714-fe0f",
  "✅": "2705",
  "📝": "1f4dd",
};

function getEmojiUrl(emoji: string): string | null {
  const code = emojiCodeMap[emoji];
  if (code) {
    return `https://fonts.gstatic.com/s/e/notoemoji/latest/${code.replace(/-/g, "_")}/512.png`;
  }
  // Fallback: try to convert unicode to code point
  const codePoint = [...emoji].map((c) => c.codePointAt(0)?.toString(16)).filter(Boolean).join("_");
  if (codePoint) {
    return `https://fonts.gstatic.com/s/e/notoemoji/latest/${codePoint}/512.png`;
  }
  return null;
}

interface NotionEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
}

export function NotionEmoji({ emoji, size = 18, className = "" }: NotionEmojiProps) {
  const url = getEmojiUrl(emoji);

  if (!url) {
    return <span className={className}>{emoji}</span>;
  }

  return (
    <img
      src={url}
      alt={emoji}
      width={size}
      height={size}
      className={`inline-block align-text-bottom ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
      loading="lazy"
    />
  );
}
