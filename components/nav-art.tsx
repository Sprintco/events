// Faint animated shapes that sit behind each top-nav label (decorative only).
// Each uses currentColor, so the colour comes from the wrapper in nav-menu.tsx. Keyframes live in globals.css.

const svgProps = {
  viewBox: "0 0 120 40",
  preserveAspectRatio: "xMidYMid slice",
  className: "size-full",
  "aria-hidden": true,
} as const;

/** Browse: a grid of tiles that pulse in a wave. */
function GridArt() {
  const cells: React.ReactNode[] = [];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      cells.push(
        <rect
          key={`${col}-${row}`}
          x={9 + col * 22}
          y={5 + row * 11.5}
          width="15"
          height="9"
          rx="2.5"
          className="nav-art-pulse"
          style={{ animationDelay: `${(col + row) * 220}ms` }}
        />,
      );
    }
  }
  return <svg {...svgProps} fill="currentColor">{cells}</svg>;
}

/** Discover: a feed card whose lines shimmer. */
function CardArt() {
  return (
    <svg {...svgProps} fill="currentColor">
      <rect x="8" y="5" width="104" height="30" rx="5" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
      <circle cx="21" cy="15" r="4.5" className="nav-art-shimmer" />
      <rect x="31" y="11" width="52" height="3.2" rx="1.6" className="nav-art-shimmer" style={{ animationDelay: "250ms" }} />
      <rect x="31" y="18" width="34" height="3.2" rx="1.6" className="nav-art-shimmer" style={{ animationDelay: "500ms" }} />
      <rect x="14" y="26" width="92" height="3.2" rx="1.6" className="nav-art-shimmer" style={{ animationDelay: "750ms" }} />
    </svg>
  );
}

/** Tickets: a ticket outline with a bar sliding along its edge. */
function TicketArt() {
  return (
    <svg {...svgProps} fill="currentColor">
      <rect x="6" y="6" width="108" height="22" rx="7" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.7" />
      <rect x="6" y="33" width="108" height="3" rx="1.5" opacity="0.3" />
      <rect x="6" y="33" width="30" height="3" rx="1.5" className="nav-art-slide" />
    </svg>
  );
}

/** Community: a little network of nodes drifting around. */
function NetworkArt() {
  const nodes = [
    { x: 14, y: 12, d: 0 },
    { x: 38, y: 29, d: 400 },
    { x: 60, y: 9, d: 800 },
    { x: 84, y: 27, d: 1200 },
    { x: 106, y: 13, d: 1600 },
    { x: 70, y: 34, d: 2000 },
  ];
  return (
    <svg {...svgProps} fill="currentColor">
      <g stroke="currentColor" strokeWidth="0.9" opacity="0.4" fill="none">
        <path d="M14 12 L38 29 L60 9 L84 27 L106 13" />
        <path d="M38 29 L70 34 L84 27" />
      </g>
      {nodes.map((n) => (
        <circle key={n.x} cx={n.x} cy={n.y} r="2.6" className="nav-art-float" style={{ animationDelay: `${n.d}ms` }} />
      ))}
    </svg>
  );
}

export const NAV_ART: Record<string, () => React.JSX.Element> = {
  Browse: GridArt,
  Discover: CardArt,
  Tickets: TicketArt,
  Community: NetworkArt,
};
