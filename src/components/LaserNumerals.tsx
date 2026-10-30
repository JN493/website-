// 404 page decoration: the numerals 4, 0, 4 are "laser-cut". A small glowing laser point traces each outline while
// the line draws in behind it, with a few soft sparks. Plays once on load (about 3.2 s in all), then stays as the
// finished brand-blue outlines with a light tint fill. Decorative only: aria-hidden, not focusable.
// CSS animation only, no runtime JavaScript. The keyframes are generated here at build time from the outline
// points, so the laser point (moved in straight lines between the corners) stays in step with the line, which is
// drawn at a constant speed with stroke-dashoffset. With prefers-reduced-motion: reduce (and as the base styles) the
// finished numerals show straight away, with no laser point and no sparks.

type Pt = readonly [number, number];

// Outlines in a 100 x 160 box per numeral, straight edges like a laser-cut stencil. Each numeral is an outer shape
// and an inner cut-out.
const FOUR: Pt[][] = [
  [[60, 0], [85, 0], [85, 100], [100, 100], [100, 125], [85, 125], [85, 160], [60, 160], [60, 125], [0, 125], [0, 100]],
  [[60, 40], [60, 100], [24, 100]],
];
const ZERO: Pt[][] = [
  [[20, 0], [80, 0], [100, 20], [100, 140], [80, 160], [20, 160], [0, 140], [0, 20]],
  [[36, 28], [64, 28], [72, 36], [72, 124], [64, 132], [36, 132], [28, 124], [28, 36]],
];
const NUMERALS = [
  { shape: FOUR, x: 0 },
  { shape: ZERO, x: 130 },
  { shape: FOUR, x: 260 },
];

const START = 0; // s, first numeral
const STEP = 0.8; // s between numeral starts (each takes 0.9 s, so they overlap slightly)
const DRAW = 0.9; // s per numeral
const SPARK_LIFE = 0.65; // s, each spark fades out over this (at least 0.6)
const SPARKS_PER_SECOND = 10; // about 7 alive at a time
const BRAND = "#004167";
const SPARK = "#5b9bd0"; // lighter brand tint, visible on white

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// A closed outline: its points (back to the start), the cumulative length at each point, and the total length.
function closed(points: Pt[], dx: number) {
  const pts = [...points, points[0]].map(([x, y]) => [x + dx, y] as const);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, length: cum[cum.length - 1] };
}

// The point at a given distance along an outline.
function pointAt(o: ReturnType<typeof closed>, dist: number): Pt {
  let i = 1;
  while (i < o.cum.length - 1 && o.cum[i] < dist) i++;
  const t = (dist - o.cum[i - 1]) / (o.cum[i] - o.cum[i - 1] || 1);
  return [o.pts[i - 1][0] + (o.pts[i][0] - o.pts[i - 1][0]) * t, o.pts[i - 1][1] + (o.pts[i][1] - o.pts[i - 1][1]) * t];
}

// Deterministic "random" in [0, 1), so the build output is stable.
const rand = (n: number) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

function build() {
  let css = "";
  const strokes: { d: string; cls: string }[] = [];
  const fills: { d: string; cls: string }[] = [];
  const lasers: string[] = [];
  const sparks: { cls: string }[] = [];
  let id = 0;
  let sparkId = 0;

  NUMERALS.forEach(({ shape, x }, n) => {
    const outlines = shape.map((p) => closed(p, x));
    const total = outlines.reduce((t, o) => t + o.length, 0);
    const numeralStart = START + n * STEP;
    let t = numeralStart;

    outlines.forEach((o) => {
      const dur = (DRAW * o.length) / total;
      const k = `ln${id}`;
      const d = "M" + o.pts.slice(0, -1).map(([px, py]) => `${px} ${py}`).join("L") + "Z";
      strokes.push({ d, cls: `ln-line ${k}` });

      // Line: a dash as long as the outline, moved from just past the end to 0 at constant speed.
      const L = r1(o.length);
      css += `@keyframes ${k}d{from{stroke-dashoffset:${r1(L + 2)}}to{stroke-dashoffset:0}}`;
      css += `.ln-anim .${k}{stroke-dasharray:${L} ${r1(L + 20)};animation:${k}d ${r3(dur)}s linear ${r3(t)}s both}`;

      // Laser point: straight moves between corners, timed by distance so it keeps pace with the line.
      // Hidden except while its own outline is being cut. Visibility is in the same keyframes as the position, so
      // the point can never show before it has moved into place (a separate visibility animation showed it at the
      // corner of the drawing for a frame).
      css += `@keyframes ${k}l{` + o.pts.map(([px, py], i) => `${r3((o.cum[i] / o.length) * 100)}%{transform:translate(${px}px,${py}px);visibility:visible}`).join("") + `}`;
      css += `.ln-anim .${k}l{visibility:hidden;animation:${k}l ${r3(dur)}s linear ${r3(t)}s}`;
      lasers.push(`${k}l`);

      // Sparks: emitted along the path as the laser passes, none during the brief overlap with the previous numeral.
      const count = Math.max(1, Math.round(dur * SPARKS_PER_SECOND));
      for (let s = 0; s < count; s++) {
        const f = (s + 0.5) / count;
        const at = t + f * dur;
        if (n > 0 && at < numeralStart + (DRAW - STEP)) continue;
        const [px, py] = pointAt(o, f * o.length);
        const angle = rand(sparkId + 1) * Math.PI * 2;
        const dist = 9 + rand(sparkId + 7) * 12;
        const ex = px + Math.cos(angle) * dist;
        const ey = py + Math.sin(angle) * dist + 6; // drifts down a little as it fades
        const c = `ls${sparkId++}`;
        css += `@keyframes ${c}{0%{transform:translate(${r1(px)}px,${r1(py)}px);opacity:0}12%{opacity:.7}100%{transform:translate(${r1(ex)}px,${r1(ey)}px);opacity:0}}`;
        css += `.ln-anim .${c}{animation:${c} ${SPARK_LIFE}s ease-out ${r3(at)}s both}`;
        sparks.push({ cls: c });
      }
      t += dur;
      id++;
    });

    // Light tint fill, faded in once the numeral is finished.
    const fd = outlines.map((o) => "M" + o.pts.slice(0, -1).map(([px, py]) => `${px} ${py}`).join("L") + "Z").join("");
    fills.push({ d: fd, cls: `ln-fill lf${n}` });
    css += `.ln-anim .lf${n}{animation:ln-fade .4s ease-out ${r3(numeralStart + DRAW)}s both}`;
  });

  // Base (final) state first; motion only when the visitor has not asked for reduced motion.
  const base = `.ln-laser,.ln-spark{display:none}`;
  const motion =
    `@keyframes ln-fade{from{opacity:0}to{opacity:1}}` +
    `.ln-anim .ln-laser,.ln-anim .ln-spark{display:inline}.ln-anim .ln-spark{opacity:0}` +
    css;
  return { strokes, fills, lasers, sparks, style: `${base}@media (prefers-reduced-motion:no-preference){${motion}}` };
}

const art = build();

export default function LaserNumerals() {
  return (
    // width/height give the aspect ratio up front, so the space is reserved before it draws (no layout shift).
    <svg
      viewBox="-20 -20 400 200"
      width={420}
      height={210}
      aria-hidden="true"
      focusable="false"
      className="ln-anim block h-auto w-full max-w-[420px]"
    >
      <style dangerouslySetInnerHTML={{ __html: art.style }} />
      <defs>
        <radialGradient id="ln-glow">
          <stop offset="0" stopColor="#3b8fd0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3b8fd0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {art.fills.map((f) => (
        <path key={f.cls} d={f.d} className={f.cls} fill="#eef4f8" fillRule="evenodd" />
      ))}
      {art.strokes.map((s) => (
        <path key={s.cls} d={s.d} className={s.cls} fill="none" stroke={BRAND} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {art.sparks.map((s) => (
        <circle key={s.cls} className={`ln-spark ${s.cls}`} r={1.4} fill={SPARK} />
      ))}
      {art.lasers.map((l) => (
        <g key={l} className={`ln-laser ${l}`}>
          <circle r={10} fill="url(#ln-glow)" />
          <circle r={2.8} fill="#8cc4ee" />
        </g>
      ))}
    </svg>
  );
}
