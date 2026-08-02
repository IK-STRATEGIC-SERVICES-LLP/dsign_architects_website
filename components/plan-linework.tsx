/* Orthographic plan linework used as a background feature behind a couple of
   editorial sections. Drawn geometry, not a specific commission — sized and
   weighted to read as "drawing" at ~3% opacity rather than as a legible plan.
   Swap the <g data-plan> contents for a traced real plan when one is exported. */

/* Structural grid. Columns A and E are the outer walls, so the bubbles and
   dimension string key off the same lines the partitions are drawn on. */
const COL_X = [129, 429, 639, 879, 1071];
const ROW_Y = [129, 340, 540, 731];
const COL_LABELS = ["A", "B", "C", "D", "E"];
const ROW_LABELS = ["1", "2", "3", "4"];

/* Bay widths in mm at 1:15 — varied, the way a real sheet reads. */
const BAY_MM = ["4500", "3150", "3600", "2900"];

const WALL = 14;
const HALF = WALL / 2;

/* Partition runs, broken where an opening occurs. */
const V_WALLS: Array<[number, number, number]> = [
  [429, 138, 300],
  [429, 380, 540],
  [429, 600, 722],
  [639, 300, 430],
  [639, 500, 722],
  [879, 138, 260],
];

const H_WALLS: Array<[number, number, number]> = [
  [340, 443, 560],
  [340, 646, 820],
  [540, 138, 320],
];

type PlanLineworkProps = {
  className?: string;
  /* Mirrors the drawing so two placements on one page don't read as a repeat. */
  flip?: boolean;
};

export function PlanLinework({ className, flip = false }: PlanLineworkProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 860"
      preserveAspectRatio="xMidYMid meet"
      className={`plan-linework ${className ?? ""}`}
      style={flip ? { transform: "scaleX(-1)" } : undefined}
    >
      <g data-plan>
        {/* Wall poché — outer envelope as an even-odd ring */}
        <path
          className="plan-wall"
          fillRule="evenodd"
          d="M120 120 H1080 V740 H120 Z M138 138 H1062 V722 H138 Z"
        />

        <g className="plan-wall">
          {V_WALLS.map(([x, y1, y2]) => (
            <rect key={`v${x}-${y1}`} x={x - HALF} y={y1} width={WALL} height={y2 - y1} />
          ))}
          {H_WALLS.map(([y, x1, x2]) => (
            <rect key={`h${y}-${x1}`} x={x1} y={y - HALF} width={x2 - x1} height={WALL} />
          ))}
        </g>

        {/* Door swings, drawn into the gaps left in the partitions above */}
        <g className="plan-line">
          <path d="M429 300 A80 80 0 0 1 509 380" />
          <path d="M429 540 A60 60 0 0 1 489 600" />
          <path d="M639 430 A70 70 0 0 0 709 500" />
          <path d="M560 340 A86 86 0 0 1 646 426" />
        </g>

        {/* Window openings — three-line glazing symbol in the outer wall */}
        <g className="plan-line">
          <path d="M200 120 H340 M200 129 H340 M200 138 H340" />
          <path d="M700 120 H860 M700 129 H860 M700 138 H860" />
          <path d="M200 722 H360 M200 731 H360 M200 740 H360" />
          <path d="M1062 300 V440 M1071 300 V440 M1080 300 V440" />
        </g>

        {/* Stair run with treads and direction arrow */}
        <g className="plan-line">
          <rect x="900" y="420" width="150" height="280" fill="none" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M900 ${444 + i * 21} H1050`} />
          ))}
          <path d="M975 688 V452 M975 452 l-10 16 M975 452 l10 16" />
        </g>

        {/* Grid bubbles — columns along the top, rows down the left */}
        <g>
          {COL_X.map((x, i) => (
            <g key={COL_LABELS[i]}>
              <path className="plan-dim" d={`M${x} 120 V64`} />
              <circle className="plan-dim" cx={x} cy="48" r="16" fill="none" />
              <text className="plan-text" x={x} y="53" textAnchor="middle">
                {COL_LABELS[i]}
              </text>
            </g>
          ))}
          {ROW_Y.map((y, i) => (
            <g key={ROW_LABELS[i]}>
              <path className="plan-dim" d={`M120 ${y} H64`} />
              <circle className="plan-dim" cx="48" cy={y} r="16" fill="none" />
              <text className="plan-text" x="48" y={y + 5} textAnchor="middle">
                {ROW_LABELS[i]}
              </text>
            </g>
          ))}
        </g>

        {/* Dimension string below the plan, with the 45° ticks drafting uses */}
        <g className="plan-dim">
          <path d="M120 800 H1080" />
          {COL_X.map((x) => (
            <path key={x} d={`M${x - 6} 807 l12 -14`} />
          ))}
        </g>
        <g className="plan-text">
          {BAY_MM.map((mm, i) => (
            <text key={mm} x={(COL_X[i] + COL_X[i + 1]) / 2} y="828" textAnchor="middle">
              {mm}
            </text>
          ))}
        </g>

        {/* North arrow */}
        <g transform="translate(1130 790)">
          <circle className="plan-dim" r="24" fill="none" />
          <path className="plan-wall" d="M0 -18 L8 8 L0 2 L-8 8 Z" />
          <text className="plan-text" y="-32" textAnchor="middle">
            N
          </text>
        </g>
      </g>
    </svg>
  );
}
