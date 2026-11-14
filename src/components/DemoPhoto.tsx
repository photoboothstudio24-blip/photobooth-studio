import type { CSSProperties } from "react";

/** Original placeholder illustration used in place of real photos (no third-party assets). */
export default function DemoPhoto({ hue = 330, className = "", style }: { hue?: number; className?: string; style?: CSSProperties }) {
  const id = `demo-bg-${hue}`;
  return (
    <svg viewBox="0 0 120 150" preserveAspectRatio="xMidYMid slice" className={className} style={style} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 75% 82%)`} />
          <stop offset="1" stopColor={`hsl(${hue + 50} 70% 62%)`} />
        </linearGradient>
      </defs>
      <rect width="120" height="150" fill={`url(#${id})`} />
      <circle cx="90" cy="36" r="15" fill="hsl(48 100% 85%)" opacity=".9" />
      <path d="M10 150c0-34 22-52 50-52s50 18 50 52z" fill={`hsl(${hue + 200} 35% 30%)`} />
      <circle cx="60" cy="68" r="22" fill="hsl(25 60% 72%)" />
      <path d="M37 66c0-20 12-30 24-30s24 10 24 30c-8-10-16-14-24-14s-16 4-24 14z" fill="hsl(20 30% 16%)" />
    </svg>
  );
}
