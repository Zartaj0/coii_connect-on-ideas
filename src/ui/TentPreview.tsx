import type { AddaStyle } from "@/data/adda";

const INK = "var(--ink)";

function Shamiana({ color }: { readonly color: string }) {
  const stripes = [0, 1, 2, 3, 4, 5, 6];
  return (
    <>
      <ellipse cx="60" cy="90" rx="46" ry="7" fill={INK} opacity="0.12" />
      <rect x="20" y="40" width="5" height="48" rx="2" fill={INK} />
      <rect x="95" y="40" width="5" height="48" rx="2" fill={INK} />
      <rect
        x="30"
        y="74"
        width="60"
        height="14"
        rx="5"
        fill="#fff1d6"
        stroke={INK}
        strokeWidth="2"
      />
      {stripes.map((i) => (
        <path
          key={i}
          d={`M${14 + i * 13} 38h13v10a6.5 6.5 0 0 1 -13 0z`}
          fill={i % 2 ? "#fff" : color}
        />
      ))}
      <path d="M14 38h92" stroke={INK} strokeWidth="2.5" />
      <path d="M10 38Q60 6 110 38z" fill={color} stroke={INK} strokeWidth="2.5" />
      <circle cx="60" cy="18" r="4" fill="var(--marigold)" stroke={INK} strokeWidth="2" />
    </>
  );
}

function Tambu({ color }: { readonly color: string }) {
  return (
    <>
      <ellipse cx="60" cy="90" rx="44" ry="7" fill={INK} opacity="0.12" />
      <path d="M16 88L60 18L104 88z" fill={color} stroke={INK} strokeWidth="2.5" />
      <path d="M60 18L38 88M60 18L82 88" stroke="#fff" strokeWidth="4" opacity="0.85" />
      <path d="M48 88L60 60L72 88z" fill={INK} opacity="0.85" />
      <path d="M60 18V4" stroke={INK} strokeWidth="2.5" />
      <path d="M60 4l14 5l-14 5z" fill="var(--marigold)" stroke={INK} strokeWidth="2" />
    </>
  );
}

function Chhatri({ color }: { readonly color: string }) {
  return (
    <>
      <ellipse cx="60" cy="92" rx="46" ry="6" fill={INK} opacity="0.12" />
      <rect
        x="18"
        y="80"
        width="84"
        height="10"
        rx="4"
        fill="#fff1d6"
        stroke={INK}
        strokeWidth="2"
      />
      {[26, 48, 66, 88].map((x) => (
        <rect
          key={x}
          x={x - 3}
          y="50"
          width="6"
          height="30"
          rx="2"
          fill="#fff"
          stroke={INK}
          strokeWidth="2"
        />
      ))}
      <rect
        x="16"
        y="44"
        width="88"
        height="8"
        rx="3"
        fill={color}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path d="M22 44a38 38 0 0 1 76 0z" fill={color} stroke={INK} strokeWidth="2.5" />
      <path d="M42 44a18 18 0 0 1 36 0" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" />
      <circle cx="60" cy="6" r="4" fill="var(--marigold)" stroke={INK} strokeWidth="2" />
    </>
  );
}

/** A little drawing of an adda tent, matching the one on the map. Decorative. */
export function TentPreview({
  kind,
  color,
  size = 72,
}: {
  readonly kind: AddaStyle;
  readonly color: string;
  readonly size?: number;
}) {
  return (
    <svg
      className="tent-preview"
      width={size}
      height={(size * 100) / 120}
      viewBox="0 0 120 100"
      aria-hidden="true"
    >
      {kind === "shamiana" ? <Shamiana color={color} /> : null}
      {kind === "tambu" ? <Tambu color={color} /> : null}
      {kind === "chhatri" ? <Chhatri color={color} /> : null}
    </svg>
  );
}
