/**
 * Deterministic, build-time generator for organic mountain skylines.
 * Runs inside Astro frontmatter, so no JavaScript is shipped for the shapes.
 * Same seed -> same mountains, so the output is stable between builds.
 */
export interface RidgeOptions {
  seed: number;
  /** y of the lowest ground line inside the viewBox */
  base: number;
  /** tallest possible peak height in viewBox units */
  amp: number;
  /** how many main summits */
  peaks: number;
  /** >1 = concave, pointy peaks; <1 = rounded, wide shoulders */
  sharp?: number;
  /** fine rock-crag roughness, relative to height */
  crag?: number;
  /** low-frequency wobble in viewBox units */
  rough?: number;
  /** optional conifer tree-line on top of the ridge */
  trees?: { w: number; h: number; gap?: number; edgeBoost?: boolean };
  W?: number;
  H?: number;
}

export function buildRidge(o: RidgeOptions): { d: string; minY: number } {
  const {
    seed,
    W = 1600,
    H = 480,
    base,
    amp,
    peaks,
    sharp = 1.6,
    crag = 0.04,
    rough = 10,
    trees,
  } = o;
  const step = 5;
  let s = seed >>> 0;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;

  const summits = Array.from({ length: peaks }, (_, i) => ({
    x: ((i + 0.5 + (rnd() - 0.5) * 1.1) / peaks) * W,
    h: amp * (0.38 + 0.62 * rnd()),
    w: (W / peaks) * (0.75 + 0.9 * rnd()),
    p: sharp * (0.85 + 0.5 * rnd()),
  }));
  const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
  const noise = (x: number) =>
    Math.sin(x * 0.011 + ph[0]) * 0.5 +
    Math.sin(x * 0.027 + ph[1]) * 0.3 +
    Math.sin(x * 0.061 + ph[2]) * 0.2;

  const ground: number[] = [];
  for (let x = 0; x <= W; x += step) {
    let h = 0;
    for (const p of summits) {
      const u = Math.abs(x - p.x) / p.w;
      if (u < 1) h = Math.max(h, p.h * Math.pow(1 - u, p.p));
    }
    h += amp * 0.12 * (noise(x) * 0.5 + 0.5);
    h *= 0.9 + 0.2 * (1 - Math.abs(noise(x * 1.7 + 3)));
    h +=
      noise(x * 2.3) * rough * (h / amp) +
      noise(x * 6.3) * crag * h +
      noise(x * 13.7) * crag * 0.6 * h * (h / amp);
    ground.push(base - h);
  }
  const yAt = (x: number) => ground[Math.min(ground.length - 1, Math.max(0, Math.round(x / step)))];

  let outline: Array<[number, number]>;
  if (!trees) {
    outline = ground.map((y, i) => [i * step, y]);
  } else {
    const trunks: Array<{ x: number; w: number; h: number }> = [];
    for (let c = 0; c < W;) {
      const w = trees.w * (0.7 + 0.7 * rnd());
      const edge = Math.pow(Math.abs(c - W / 2) / (W / 2), 1.6);
      const h = trees.h * (0.55 + 0.9 * rnd()) * (trees.edgeBoost ? 0.45 + edge * 1.1 : 1);
      trunks.push({ x: c + w, w, h });
      c += w * (trees.gap ?? 1.1) * (1 + rnd() * 1.6);
    }
    outline = [];
    let ti = 0;
    for (let x = 0; x <= W; x += 2) {
      while (ti < trunks.length && trunks[ti].x + trunks[ti].w < x) ti++;
      let y = yAt(x);
      const t = trunks[ti];
      if (t && Math.abs(x - t.x) < t.w) {
        const prof = 1 - Math.abs(x - t.x) / t.w;
        y -= t.h * Math.max(0, (Math.floor(prof * 3 + 0.35) / 3) * 0.55 + prof * 0.45);
      }
      outline.push([x, y]);
    }
  }
  const f = (n: number) => Math.round(n * 10) / 10;
  const d = `M0 ${H}L${outline.map(([x, y]) => `${f(x)} ${f(y)}`).join('L')}L${W} ${H}Z`;
  return { d, minY: Math.min(...outline.map((p) => p[1])) };
}
