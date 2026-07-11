/**
 * Human Design chart helpers for vision.
 *
 * Calculations use astronomy-engine planetary positions + the standard
 * Rave Mandala gate wheel (Gate 41 at 2° Aquarius). Design is ~88° of
 * solar arc before birth. This is for personal insight in-app — not a
 * substitute for a certified analyst or commercial bodygraph service.
 */
import * as Astronomy from "astronomy-engine";

export type HDType =
  | "Manifestor"
  | "Generator"
  | "Manifesting Generator"
  | "Projector"
  | "Reflector";

export type HDCenterId =
  | "head"
  | "ajna"
  | "throat"
  | "g"
  | "heart"
  | "sacral"
  | "spleen"
  | "solar"
  | "root";

export interface HDActivation {
  planet: string;
  gate: number;
  line: number;
  /** personality = black (conscious), design = red (unconscious) */
  side: "personality" | "design";
}

export interface HumanDesignChart {
  type: HDType;
  strategy: string;
  authority: string;
  profile: string; // e.g. "1/3"
  definition: string;
  notSelf: string;
  signature: string;
  /** Personality Sun gate.line */
  consciousSun: string;
  /** Design Sun gate.line */
  unconsciousSun: string;
  centers: Record<HDCenterId, boolean>;
  definedChannels: string[];
  activations: HDActivation[];
  /** ISO birth used */
  birthLocal: string;
  computedAt: string;
  /** true if birth time was missing — less precise */
  approximate: boolean;
  notes: string[];
}

/** Gate order on the mandala starting at 2° Aquarius (Gate 41). */
const GATE_ORDER = [
  41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21, 51, 42, 3, 27, 24, 2, 23,
  8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64,
  47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58,
  38, 54, 61, 60,
] as const;

/** Absolute ecliptic longitude where Gate 41 begins (2° Aquarius). */
const WHEEL_START = 302; // degrees
const GATE_SIZE = 360 / 64; // 5.625
const LINE_SIZE = GATE_SIZE / 6; // 0.9375

/** Channels: gate pairs that form a channel + centers they connect */
const CHANNELS: Array<{
  gates: [number, number];
  centers: [HDCenterId, HDCenterId];
  name: string;
}> = [
  { gates: [1, 8], centers: ["g", "throat"], name: "1-8" },
  { gates: [2, 14], centers: ["g", "sacral"], name: "2-14" },
  { gates: [3, 60], centers: ["sacral", "root"], name: "3-60" },
  { gates: [4, 63], centers: ["ajna", "head"], name: "4-63" },
  { gates: [5, 15], centers: ["sacral", "g"], name: "5-15" },
  { gates: [6, 59], centers: ["solar", "sacral"], name: "6-59" },
  { gates: [7, 31], centers: ["g", "throat"], name: "7-31" },
  { gates: [9, 52], centers: ["sacral", "root"], name: "9-52" },
  { gates: [10, 20], centers: ["g", "throat"], name: "10-20" },
  { gates: [10, 34], centers: ["g", "sacral"], name: "10-34" },
  { gates: [10, 57], centers: ["g", "spleen"], name: "10-57" },
  { gates: [11, 56], centers: ["ajna", "throat"], name: "11-56" },
  { gates: [12, 22], centers: ["throat", "solar"], name: "12-22" },
  { gates: [13, 33], centers: ["g", "throat"], name: "13-33" },
  { gates: [16, 48], centers: ["throat", "spleen"], name: "16-48" },
  { gates: [17, 62], centers: ["ajna", "throat"], name: "17-62" },
  { gates: [18, 58], centers: ["spleen", "root"], name: "18-58" },
  { gates: [19, 49], centers: ["root", "solar"], name: "19-49" },
  { gates: [20, 34], centers: ["throat", "sacral"], name: "20-34" },
  { gates: [20, 57], centers: ["throat", "spleen"], name: "20-57" },
  { gates: [21, 45], centers: ["heart", "throat"], name: "21-45" },
  { gates: [23, 43], centers: ["throat", "ajna"], name: "23-43" },
  { gates: [24, 61], centers: ["ajna", "head"], name: "24-61" },
  { gates: [25, 51], centers: ["g", "heart"], name: "25-51" },
  { gates: [26, 44], centers: ["heart", "spleen"], name: "26-44" },
  { gates: [27, 50], centers: ["sacral", "spleen"], name: "27-50" },
  { gates: [28, 38], centers: ["spleen", "root"], name: "28-38" },
  { gates: [29, 46], centers: ["sacral", "g"], name: "29-46" },
  { gates: [30, 41], centers: ["solar", "root"], name: "30-41" },
  { gates: [32, 54], centers: ["spleen", "root"], name: "32-54" },
  { gates: [34, 57], centers: ["sacral", "spleen"], name: "34-57" },
  { gates: [35, 36], centers: ["throat", "solar"], name: "35-36" },
  { gates: [37, 40], centers: ["solar", "heart"], name: "37-40" },
  { gates: [39, 55], centers: ["root", "solar"], name: "39-55" },
  { gates: [42, 53], centers: ["sacral", "root"], name: "42-53" },
  { gates: [47, 64], centers: ["ajna", "head"], name: "47-64" },
];

const CENTER_LABELS: Record<HDCenterId, string> = {
  head: "Head",
  ajna: "Ajna",
  throat: "Throat",
  g: "G / Identity",
  heart: "Heart / Ego",
  sacral: "Sacral",
  spleen: "Spleen",
  solar: "Solar Plexus",
  root: "Root",
};

const TYPE_META: Record<
  HDType,
  { strategy: string; notSelf: string; signature: string; blurb: string }
> = {
  Manifestor: {
    strategy: "Inform before you act",
    notSelf: "Anger",
    signature: "Peace",
    blurb: "You're here to initiate. Inform the people your moves will touch — then go.",
  },
  Generator: {
    strategy: "Wait to respond",
    notSelf: "Frustration",
    signature: "Satisfaction",
    blurb: "Your sacral knows. Wait for life to poke you, then respond with a full-body yes.",
  },
  "Manifesting Generator": {
    strategy: "Wait to respond, then inform",
    notSelf: "Frustration / anger",
    signature: "Satisfaction / peace",
    blurb: "Respond first, then move fast — and inform when your multi-path energy pivots.",
  },
  Projector: {
    strategy: "Wait for the invitation",
    notSelf: "Bitterness",
    signature: "Success",
    blurb: "You're here to guide. Recognition and invitation unlock your mastery.",
  },
  Reflector: {
    strategy: "Wait a lunar cycle (≈28 days)",
    notSelf: "Disappointment",
    signature: "Surprise",
    blurb: "You sample the world. Big decisions want a full moon cycle of clarity.",
  },
};

const PROFILE_META: Record<string, string> = {
  "1/3": "Investigator / Martyr — research, then learn by living it.",
  "1/4": "Investigator / Opportunist — deep foundations + close network.",
  "2/4": "Hermit / Opportunist — natural gifts called out by others.",
  "2/5": "Hermit / Heretic — private genius, public projection.",
  "3/5": "Martyr / Heretic — trial-and-error that becomes medicine for others.",
  "3/6": "Martyr / Role Model — three life phases; wisdom after experiment.",
  "4/6": "Opportunist / Role Model — network first, then embody the example.",
  "4/1": "Opportunist / Investigator — fixed foundation through relationships.",
  "5/1": "Heretic / Investigator — practical solutions built on solid study.",
  "5/2": "Heretic / Hermit — projected savior energy with a private cave.",
  "6/2": "Role Model / Hermit — observer who becomes the living example.",
  "6/3": "Role Model / Martyr — experimental path toward embodied wisdom.",
};

function lon(body: Astronomy.Body, date: Date): number {
  const vec = Astronomy.GeoVector(body, date, true);
  const ecl = Astronomy.Ecliptic(vec);
  return ((ecl.elon % 360) + 360) % 360;
}

function gateLineFromLongitude(longitude: number): { gate: number; line: number } {
  const rel = ((longitude - WHEEL_START) % 360 + 360) % 360;
  const idx = Math.min(63, Math.floor(rel / GATE_SIZE));
  const within = rel - idx * GATE_SIZE;
  const line = Math.min(6, Math.floor(within / LINE_SIZE) + 1);
  return { gate: GATE_ORDER[idx]!, line };
}

/** Find datetime when Sun is ~88° earlier in longitude than at birth. */
function designDate(birth: Date): Date {
  const sunBirth = lon(Astronomy.Body.Sun, birth);
  const target = (sunBirth - 88 + 360) % 360;
  // Binary search ~70–100 days before birth
  let lo = birth.getTime() - 100 * 86400000;
  let hi = birth.getTime() - 70 * 86400000;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const d = new Date(mid);
    const s = lon(Astronomy.Body.Sun, d);
    // distance from s forward to sunBirth should approach 88
    let forward = (sunBirth - s + 360) % 360;
    if (forward < 88) hi = mid;
    else lo = mid;
    void target;
  }
  return new Date((lo + hi) / 2);
}

function nodeLongitude(date: Date): { north: number; south: number } {
  // Mean ascending node approximation via astronomy-engine Moon nodes
  // Use Moon's ascending node from orbital elements proxy: true node via
  // Astronomy.SearchMoonNode is event-based; use ecliptic of lunar ascending node formula.
  // astronomy-engine: Body.EMB and equinox — simpler: use Moon longitude ± for mean node
  // Fallback: use Moon's position and a rough mean node from VSOP-free formula.
  const t = (date.getTime() / 86400000 - 10957.5) / 36525; // centuries from J2000 approx
  // Mean longitude of ascending node (deg), simplified IAU-ish
  let omega =
    125.0445479 -
    1934.1362891 * t +
    0.0020754 * t * t;
  omega = ((omega % 360) + 360) % 360;
  return { north: omega, south: (omega + 180) % 360 };
}

function activationsForDate(
  date: Date,
  side: "personality" | "design",
): HDActivation[] {
  const planets: Array<{ name: string; body?: Astronomy.Body; lon?: number }> = [
    { name: "Sun", body: Astronomy.Body.Sun },
    { name: "Moon", body: Astronomy.Body.Moon },
    { name: "Mercury", body: Astronomy.Body.Mercury },
    { name: "Venus", body: Astronomy.Body.Venus },
    { name: "Mars", body: Astronomy.Body.Mars },
    { name: "Jupiter", body: Astronomy.Body.Jupiter },
    { name: "Saturn", body: Astronomy.Body.Saturn },
    { name: "Uranus", body: Astronomy.Body.Uranus },
    { name: "Neptune", body: Astronomy.Body.Neptune },
    { name: "Pluto", body: Astronomy.Body.Pluto },
  ];

  const out: HDActivation[] = [];
  const sunL = lon(Astronomy.Body.Sun, date);
  const earthL = (sunL + 180) % 360;
  for (const p of [
    { name: "Sun", l: sunL },
    { name: "Earth", l: earthL },
  ]) {
    const gl = gateLineFromLongitude(p.l);
    out.push({ planet: p.name, gate: gl.gate, line: gl.line, side });
  }

  for (const p of planets.slice(1)) {
    if (!p.body) continue;
    const l = lon(p.body, date);
    const gl = gateLineFromLongitude(l);
    out.push({ planet: p.name, gate: gl.gate, line: gl.line, side });
  }

  const nodes = nodeLongitude(date);
  for (const p of [
    { name: "North Node", l: nodes.north },
    { name: "South Node", l: nodes.south },
  ]) {
    const gl = gateLineFromLongitude(p.l);
    out.push({ planet: p.name, gate: gl.gate, line: gl.line, side });
  }

  return out;
}

function uniqueGates(activations: HDActivation[]): Set<number> {
  return new Set(activations.map((a) => a.gate));
}

function computeDefinition(
  centers: Record<HDCenterId, boolean>,
  channels: string[],
): string {
  const defined = (Object.keys(centers) as HDCenterId[]).filter((c) => centers[c]);
  if (defined.length === 0) return "No Definition (Reflector)";
  if (channels.length === 0) return "No Definition";
  // Simple connectivity: count linked center groups via channels
  const parent = new Map<HDCenterId, HDCenterId>();
  const find = (x: HDCenterId): HDCenterId => {
    const p = parent.get(x) ?? x;
    if (p !== x) {
      const r = find(p);
      parent.set(x, r);
      return r;
    }
    return x;
  };
  const union = (a: HDCenterId, b: HDCenterId) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };
  for (const c of defined) parent.set(c, c);
  for (const ch of CHANNELS) {
    if (!channels.includes(ch.name)) continue;
    union(ch.centers[0], ch.centers[1]);
  }
  const roots = new Set(defined.map((c) => find(c)));
  const n = roots.size;
  if (n <= 1) return "Single Definition";
  if (n === 2) return "Split Definition";
  if (n === 3) return "Triple Split";
  return "Quadruple Split";
}

function motorToThroat(centers: Record<HDCenterId, boolean>, channels: string[]): boolean {
  // Motors: root, solar, heart, sacral — path to throat via defined channels
  if (!centers.throat) return false;
  const motors: HDCenterId[] = ["root", "solar", "heart", "sacral"];
  if (!motors.some((m) => centers[m])) return false;

  // BFS on channel graph
  const adj = new Map<HDCenterId, HDCenterId[]>();
  const add = (a: HDCenterId, b: HDCenterId) => {
    if (!adj.has(a)) adj.set(a, []);
    adj.get(a)!.push(b);
  };
  for (const ch of CHANNELS) {
    if (!channels.includes(ch.name)) continue;
    const [a, b] = ch.centers;
    add(a, b);
    add(b, a);
  }
  for (const start of motors) {
    if (!centers[start]) continue;
    const seen = new Set<HDCenterId>();
    const q: HDCenterId[] = [start];
    while (q.length) {
      const c = q.shift()!;
      if (c === "throat") return true;
      if (seen.has(c)) continue;
      seen.add(c);
      for (const n of adj.get(c) || []) {
        if (centers[n]) q.push(n);
      }
    }
  }
  return false;
}

function authorityFor(
  type: HDType,
  centers: Record<HDCenterId, boolean>,
): string {
  if (type === "Reflector") return "Lunar (wait a cycle)";
  if (centers.solar) return "Emotional (solar plexus) — ride the wave";
  if (centers.sacral) return "Sacral — gut yes / no";
  if (centers.spleen) return "Splenic — instant intuitive hit";
  if (centers.heart) return "Ego / Heart — willpower & commitment";
  if (centers.g && type === "Projector") return "Self-Projected — listen to your voice";
  if (type === "Projector") return "Environmental / Mental — talk it out in the right place";
  if (centers.g) return "G Center — identity direction";
  return "Outer authority — wise counsel (no inner authority)";
}

export function computeHumanDesign(input: {
  /** YYYY-MM-DD */
  birthDate: string;
  /** HH:mm 24h local, optional */
  birthTime?: string;
  /** Timezone offset minutes east of UTC, e.g. -300 for EST. Default: browser local */
  tzOffsetMinutes?: number;
}): HumanDesignChart {
  const notes: string[] = [];
  const approximate = !input.birthTime;

  const [y, m, d] = input.birthDate.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error("Enter a valid birth date");
  }

  let hh = 12;
  let mm = 0;
  if (input.birthTime) {
    const [h, mi] = input.birthTime.split(":").map(Number);
    hh = h || 0;
    mm = mi || 0;
  } else {
    notes.push("No birth time — used noon. Add a time for a more accurate chart.");
  }

  // Interpret as local civil time → UTC via offset
  const offset =
    input.tzOffsetMinutes !== undefined
      ? input.tzOffsetMinutes
      : -new Date().getTimezoneOffset();
  // local = UTC + offset → UTC = local - offset
  const utcMs =
    Date.UTC(y, m - 1, d, hh, mm, 0) - offset * 60_000;
  const birth = new Date(utcMs);
  const design = designDate(birth);

  const activations = [
    ...activationsForDate(birth, "personality"),
    ...activationsForDate(design, "design"),
  ];

  const gates = uniqueGates(activations);
  const definedChannels: string[] = [];
  const centers: Record<HDCenterId, boolean> = {
    head: false,
    ajna: false,
    throat: false,
    g: false,
    heart: false,
    sacral: false,
    spleen: false,
    solar: false,
    root: false,
  };

  for (const ch of CHANNELS) {
    const [g1, g2] = ch.gates;
    if (gates.has(g1) && gates.has(g2)) {
      definedChannels.push(ch.name);
      centers[ch.centers[0]] = true;
      centers[ch.centers[1]] = true;
    }
  }

  // Also mark centers from hanging gates that still define a center
  // (simplified: only full channels define centers — standard HD uses gates per center;
  //  for type we need sacral defined from any sacral gate activation)
  const CENTER_GATES: Record<HDCenterId, number[]> = {
    head: [64, 61, 63],
    ajna: [47, 24, 4, 17, 43, 11],
    throat: [62, 23, 56, 35, 12, 45, 33, 8, 31, 20, 16],
    g: [7, 1, 13, 25, 46, 2, 15, 10],
    heart: [21, 40, 26, 51],
    sacral: [5, 14, 29, 59, 9, 3, 42, 27, 34],
    spleen: [48, 57, 44, 50, 32, 28, 18],
    solar: [6, 37, 22, 36, 30, 55, 49, 19, 39],
    root: [58, 38, 54, 53, 60, 52, 19, 39, 41, 58],
  };
  for (const [center, gs] of Object.entries(CENTER_GATES) as [HDCenterId, number[]][]) {
    if (gs.some((g) => gates.has(g))) centers[center] = true;
  }

  const sacral = centers.sacral;
  const m2t = motorToThroat(centers, definedChannels);
  const anyCenter = (Object.values(centers) as boolean[]).some(Boolean);

  let type: HDType;
  if (!anyCenter) type = "Reflector";
  else if (!sacral) type = m2t ? "Manifestor" : "Projector";
  else type = m2t ? "Manifesting Generator" : "Generator";

  const persSun = activations.find(
    (a) => a.side === "personality" && a.planet === "Sun",
  );
  const desSun = activations.find(
    (a) => a.side === "design" && a.planet === "Sun",
  );
  const profile = `${persSun?.line ?? "?"}/${desSun?.line ?? "?"}`;

  const meta = TYPE_META[type];
  const definition = computeDefinition(centers, definedChannels);

  return {
    type,
    strategy: meta.strategy,
    authority: authorityFor(type, centers),
    profile,
    definition,
    notSelf: meta.notSelf,
    signature: meta.signature,
    consciousSun: persSun ? `${persSun.gate}.${persSun.line}` : "—",
    unconsciousSun: desSun ? `${desSun.gate}.${desSun.line}` : "—",
    centers,
    definedChannels,
    activations,
    birthLocal: `${input.birthDate}T${input.birthTime || "12:00"}`,
    computedAt: new Date().toISOString(),
    approximate,
    notes: [
      ...notes,
      meta.blurb,
      PROFILE_META[profile] || `Profile ${profile}`,
    ],
  };
}

export function centerLabel(id: HDCenterId): string {
  return CENTER_LABELS[id];
}

export function typeBlurb(type: HDType): string {
  return TYPE_META[type].blurb;
}

/** Manual chart when user already knows their design */
export function chartFromManual(input: {
  type: HDType;
  profile: string;
  authority: string;
  strategy?: string;
}): HumanDesignChart {
  const meta = TYPE_META[input.type];
  return {
    type: input.type,
    strategy: input.strategy || meta.strategy,
    authority: input.authority,
    profile: input.profile,
    definition: "—",
    notSelf: meta.notSelf,
    signature: meta.signature,
    consciousSun: "—",
    unconsciousSun: "—",
    centers: {
      head: false,
      ajna: false,
      throat: false,
      g: false,
      heart: false,
      sacral: false,
      spleen: false,
      solar: false,
      root: false,
    },
    definedChannels: [],
    activations: [],
    birthLocal: "",
    computedAt: new Date().toISOString(),
    approximate: false,
    notes: [meta.blurb, PROFILE_META[input.profile] || `Profile ${input.profile}`, "Entered manually"],
  };
}

export const HD_TYPES: HDType[] = [
  "Manifestor",
  "Generator",
  "Manifesting Generator",
  "Projector",
  "Reflector",
];

export const HD_PROFILES = [
  "1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6", "4/1", "5/1", "5/2", "6/2", "6/3",
];

export const HD_AUTHORITIES = [
  "Emotional (solar plexus) — ride the wave",
  "Sacral — gut yes / no",
  "Splenic — instant intuitive hit",
  "Ego / Heart — willpower & commitment",
  "Self-Projected — listen to your voice",
  "Environmental / Mental — talk it out in the right place",
  "Lunar (wait a cycle)",
  "Outer authority — wise counsel (no inner authority)",
];
