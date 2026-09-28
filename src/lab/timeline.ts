import { projects } from "@/data/projects";
import { timeline } from "@/data/timeline";

// Scroll choreography for the Test page: one continuous scroll through four beats. The opening word, a spiral staircase
// climbed through the career timeline (a step for every chapter), a neural network of project work, and the closing mark.
// Between the staircase and the network, the camera dives into the last chapter's card until it fills the screen, the
// card dissolves, and the camera carries on through it to the network.
// A scene coordinate is the section index plus progress through that section, from 0 to 4.

export const SHAPES = ["galaxy", "complexity", "into", "possibility", "staircase", "network", "monogram"] as const;
export type ShapeName = (typeof SHAPES)[number];

export const SCENE_LABELS = ["Possibility", "Timeline", "Work", "Contact"] as const;
export const LAST_SCENE = SCENE_LABELS.length - 1;

type V3 = readonly [number, number, number];
type Pose = { position: V3; target: V3 };

export const CAMERA_FOV = 50;
export const CARD_SIZE = { width: 3.2, height: 2 } as const;
export const HERO = { z: 0, distance: 14 } as const;
export const MILESTONE_COUNT = timeline.length;

// Every project on the Work page gets a neuron in the network, grouped by category (in the order categories first
// appear) and split into stops of two or three, so a category of seven becomes stops of three, two, and two.
export const PROJECT_CATEGORIES = [...new Set(projects.map(project => project.category))];
export const ORDERED_PROJECTS = PROJECT_CATEGORIES.flatMap(category => projects.filter(project => project.category === category));
export const CARD_COUNT = ORDERED_PROJECTS.length;
export type Stop = { category: string; members: number[] };
export const STOPS: Stop[] = (() => {
  const stops: Stop[] = [];
  let next = 0;
  for (const category of PROJECT_CATEGORIES) {
    const size = ORDERED_PROJECTS.filter(project => project.category === category).length;
    const parts = Math.ceil(size / 3);
    for (let part = 0; part < parts; part++) {
      const count = Math.floor(size / parts) + (part < size % parts ? 1 : 0);
      stops.push({ category, members: Array.from({ length: count }, (_, i) => next + i) });
      next += count;
    }
  }
  return stops;
})();
export const STOP_COUNT = STOPS.length;
const SLOTS = STOPS.flatMap((stop, index) => stop.members.map((_, slot) => ({ stop: index, slot, size: stop.members.length })));
// Which stop a project (by its index in ORDERED_PROJECTS) belongs to, and where it sits in that stop.
export const stopOf = (project: number) => SLOTS[project];
export const categoryStop = (category: string) => STOPS.findIndex(stop => stop.category === category);

// The staircase stands on the vertical axis x = 0, z = AXIS_Z.
export const AXIS_Z = -40;

// Timeline: a spiral staircase climbed from `base`, the oldest chapter, one milestone per `spacing` of rise. The camera
// travels on the treads at eye level and looks toward the next part of the spiral, so the climb reads in first person.
export const STAIRS = { base: 0, spacing: 5.3, inner: 0.6, outer: 4.4, rail: 4.5, stepHeight: 0.26, turn: (Math.PI * 2) / Math.max(1, MILESTONE_COUNT - 1) } as const;
export const STAIR_STEP_ARC = ((STAIRS.turn + Math.PI * 2) * STAIRS.stepHeight) / STAIRS.spacing;
export const STAIR_LANDING_Y = STAIRS.base + (MILESTONE_COUNT - 1) * STAIRS.spacing;
export const STAIR_TREAD_INNER = 1.35;
export const STAIR_TREAD_OUTER = 3.85;
export const STAIR_LANDING = { length: 7, width: STAIR_TREAD_OUTER - STAIR_TREAD_INNER, eye: 0.65, card: 3.5 } as const;
// Count down from the landing so every stair renderer and particle layer shares the exact same tread heights.
export const stairStepY = (stepFromLanding: number) => STAIR_LANDING_Y - stepFromLanding * STAIRS.stepHeight;
// Work: a neural network laid out left to right, just above the top of the stairs and further along the dive, so
// passing through the last card carries the camera forward to it. Each layer is a ring of neurons around the network's horizontal axis
// (y = NETWORK.y, z = NETWORK.axisZ), one layer every `spacing` along x, with an input layer before the first stop and
// an output layer after the last. Each stop is a layer whose projects sit on the front of its ring with their cards
// beside it, and the camera pans right from one stop to the next.
export const NETWORK = { axisZ: AXIS_Z - 24, y: STAIRS.base + (MILESTONE_COUNT - 1) * STAIRS.spacing + 6, spacing: 14, perLayer: 7, edgeLayer: 5 } as const;
export const layerX = (layer: number) => layer * NETWORK.spacing;
// The closing mark sits further right, so the camera keeps panning into it after the last stop.
export const CLOSE = { x: layerX(STOP_COUNT - 1) + 18, y: NETWORK.y, z: NETWORK.axisZ - 10, distance: 14 } as const;

// Where each beat plays in scene coordinates.
// The work copy ("What are you looking for?") plays over the network as it forms, in section-local coordinates, and
// the first stop only appears once it has gone. The transition and copy take the first fifth of the work section.
// The timeline copy ("Every chapter built the next one.") holds centre screen, burns off, and only then does the
// staircase bring its cards in, so the first card never lands behind the words.
const TIMELINE_COPY = [-0.1, 0.02, 0.12, 0.24] as const;
const WORK_COPY = [0.1, 0.14, 0.19, 0.22] as const;
export const WINDOWS = { timeline: [1 + TIMELINE_COPY[3] + 0.03, 1.86], work: [2 + WORK_COPY[3] + 0.03, 2.97], close: 3.3 } as const;
// Once the work prompt has cleared, hold the camera on the first three projects before beginning the horizontal pan.
// This gives that opening group the same readable pause as every later stop instead of revealing it during departure.
const WORK_PAN_START = WINDOWS.work[0] + 0.05;
// The handoff from the staircase to the network: dive until the last card fills the screen, dissolve it, go through.
// After going through, the camera holds on the first stop while the copy plays, then the pan begins.
export const TRANSITION = { dive: [WINDOWS.timeline[1], 2.0], dissolve: [2.0, 2.035], through: [2.03, 2.14] } as const;

type Morph = { from: ShapeName; to: ShapeName; start: number; end: number };

// Each morph runs across a stretch of scroll; between morphs the last shape holds. The staircase becomes the network
// behind the full-screen card, so the network is already forming when the card dissolves.
export const MORPHS: readonly Morph[] = [
  { from: "possibility", to: "staircase", start: 0.45, end: WINDOWS.timeline[0] },
  { from: "staircase", to: "network", start: 1.98, end: 2.1 },
  { from: "network", to: "monogram", start: WINDOWS.work[1], end: WINDOWS.close },
];

// Particles gather from the toolkit into COMPLEXITY, turn to INTO, then to POSSIBILITY, so the opening line is spoken
// by the particles themselves rather than repeated as page text. Times in seconds.
export const INTRO = { gather: [0.15, 2.3], turn: [3, 3.9], turn2: [4.5, 5.4], copy: 5.1, end: 5.4 } as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const ease = (value: number) => value * value * (3 - 2 * value);
export const smoothRange = (start: number, end: number, value: number) => ease(clamp01((value - start) / (end - start)));

export function morphAt(s: number) {
  let state = { from: MORPHS[0].from, to: MORPHS[0].from, mix: 0 };
  for (const morph of MORPHS) {
    if (s < morph.start) break;
    state = { from: morph.from, to: morph.to, mix: clamp01((s - morph.start) / (morph.end - morph.start)) };
  }
  return state;
}

export function introMorph(seconds: number) {
  if (seconds < INTRO.turn[0]) return { from: "galaxy" as ShapeName, to: "complexity" as ShapeName, mix: clamp01((seconds - INTRO.gather[0]) / (INTRO.gather[1] - INTRO.gather[0])) };
  if (seconds < INTRO.turn2[0]) return { from: "complexity" as ShapeName, to: "into" as ShapeName, mix: clamp01((seconds - INTRO.turn[0]) / (INTRO.turn[1] - INTRO.turn[0])) };
  return { from: "into" as ShapeName, to: "possibility" as ShapeName, mix: clamp01((seconds - INTRO.turn2[0]) / (INTRO.turn2[1] - INTRO.turn2[0])) };
}

// The scattering swirl belongs to the opening gather and the closing mark. While scrolling through the staircase and
// the network, particles morph in straight lines and barely drift, so the structures stay crisp.
export function swirlFor(morph: { from: ShapeName; to: ShapeName }) {
  const scrollBeats: ShapeName[] = ["staircase", "network"];
  return morph.to === "monogram" || (!scrollBeats.includes(morph.from) && !scrollBeats.includes(morph.to)) ? 1 : 0;
}

// The cursor pushes particles aside only on the opening COMPLEXITY / POSSIBILITY word, and lets go as soon as scrolling
// moves on from it.
export const cursorRepel = (s: number) => 1 - smoothRange(0.3, 0.5, s);

export function ambientFlow(s: number) {
  const weights = beatWeights(s);
  return 1 - 0.75 * (weights.timeline + weights.work);
}

// The climb holds on the oldest chapter for the first twentieth of the window, so that card arrives square to the
// camera and stays square for a beat instead of already leaning into the spiral as it fades in.
const CLIMB_LEAD = 0.05;
const climbStart = WINDOWS.timeline[0] + (WINDOWS.timeline[1] - WINDOWS.timeline[0]) * CLIMB_LEAD;

// Progress through the climb, measured in milestones. Each chapter holds squarely in the center, then the camera
// makes a shorter eased climb to the next one. This keeps a card readable instead of letting it immediately drift away.
export const timelinePosition = (s: number) => {
  const last = MILESTONE_COUNT - 1;
  const raw = clamp01((s - climbStart) / (WINDOWS.timeline[1] - climbStart)) * last;
  if (raw >= last) return last;
  const chapter = Math.floor(raw);
  return chapter + smoothRange(0.2, 0.8, raw - chapter);
};
// The scene coordinate at which the camera is square on a milestone.
export const milestoneScene = (index: number) => climbStart + (MILESTONE_COUNT <= 1 ? 0 : index / (MILESTONE_COUNT - 1)) * (WINDOWS.timeline[1] - climbStart);
export const workPosition = (s: number) => clamp01((s - WORK_PAN_START) / (WINDOWS.work[1] - WORK_PAN_START)) * (STOP_COUNT - 1);
// The scene coordinate at which the camera is centered on a stop.
export const stopScene = (stop: number) => stop === 0 || STOP_COUNT <= 1
  ? WINDOWS.work[0]
  : WORK_PAN_START + (stop / (STOP_COUNT - 1)) * (WINDOWS.work[1] - WORK_PAN_START);

// How much each beat is on screen, for fades and ambient motion. The four weights always sum to one. The timeline
// holds through the dive and hands over to the work as the camera goes through the card.
export function beatWeights(s: number) {
  const intoTimeline = smoothRange(0.45, WINDOWS.timeline[0], s);
  const intoWork = smoothRange(TRANSITION.through[0], WINDOWS.work[0], s);
  const intoClose = smoothRange(WINDOWS.work[1], WINDOWS.close, s);
  return { hero: 1 - intoTimeline, timeline: intoTimeline * (1 - intoWork), work: intoWork * (1 - intoClose), close: intoClose };
}

// The camera walks along the treads and looks slightly down at the next few steps, with each card centered ahead.
export function stairsFrame() {
  return {
    eyeRadius: 2.65,
    eyeHeight: 1.3,
    eyeShift: 0.15,
    lookRadius: 1.6,
    lookLead: 0.15,
    lookLift: -0.42,
  };
}

// Layer rings are taller than they are deep so they read as columns. On wide screens a stop's layer is a spine with its
// cards branching off both sides, two to a row (left, then right), each card `reach` from the spine and joined to its own
// neuron; a stop's two neurons in a row sit `pair` above and below the row so they don't overlap. On narrow screens the
// cards stack in one column to the right of the spine. Cards in a stop are `gap` apart. The camera trails a little behind
// the current stop so the view leans into the direction of travel, and aims `aim` above the axis so the cards sit a
// little low on screen, clear of the header.
export function networkFrame(aspect: number) {
  return aspect < 1
    ? { height: 3.4, depth: 1.8, columns: 1, cardScale: 1.05, gap: 0.25, reach: 2.05, pair: 0, distance: 12.5, lift: 0.3, lead: 0.2, shift: 2.4, aim: 0 }
    : { height: 3, depth: 1.8, columns: 2, cardScale: 1.6, gap: 0.35, reach: 3.2, pair: 0.3, distance: 11.5, lift: 0.4, lead: 0.8, shift: 0, aim: 0.45 };
}

// Where a slot in a stop of `size` projects sits: which side of the spine its card is on, the height of its row above the
// network's axis (rows centered as a group), and the height of its neuron.
export function slotPlace(slot: number, size: number, aspect: number) {
  const frame = networkFrame(aspect);
  const rows = Math.ceil(size / frame.columns);
  const side = frame.columns === 1 || slot % 2 === 1 ? 1 : -1;
  const rowY = ((rows - 1) / 2 - Math.floor(slot / frame.columns)) * (CARD_SIZE.height * frame.cardScale + frame.gap);
  return { side, rowY, neuronY: rowY - (frame.columns === 1 ? 0 : side * frame.pair) };
}

// The staircase's angle around the axis at height y; steps, rail, and milestones all share it.
export const stairsAngleAt = (y: number) => ((y - STAIRS.base) / STAIRS.spacing) * (STAIRS.turn + Math.PI * 2);
// The walking camera rides near the middle of each tread instead of balancing on its leading edge.
export const stairsViewAngleAt = (y: number) => stairsAngleAt(y) + STAIR_STEP_ARC * 0.45;
// The last tread opens onto a straight platform. All landing geometry, particles, and the camera share this basis.
export function landingPoint(forward: number, side = 0, lift = 0): V3 {
  const angle = stairsAngleAt(STAIR_LANDING_Y);
  const radius = (STAIR_TREAD_INNER + STAIR_TREAD_OUTER) / 2 + side;
  return [
    Math.sin(angle) * radius + Math.cos(angle) * forward,
    STAIR_LANDING_Y + lift,
    AXIS_Z + Math.cos(angle) * radius - Math.sin(angle) * forward,
  ];
}

function landingPose(): Pose {
  const { eyeHeight } = stairsFrame();
  return { position: landingPoint(STAIR_LANDING.eye, 0, eyeHeight), target: landingPoint(STAIR_LANDING.card, 0, eyeHeight) };
}

// Size by actual projected bounds, including the closer edge of an upright card when looking down the stairs.
// This avoids the old sudden size drop at portrait aspect ratios while retaining space around all four corners.
function milestoneScale(eye: V3, card: V3, aspect: number) {
  const distance = Math.hypot(eye[0] - card[0], eye[1] - card[1], eye[2] - card[2]);
  const pitch = Math.abs(eye[1] - card[1]) / distance;
  const vertical = Math.sqrt(1 - pitch * pitch);
  const tan = Math.tan(CAMERA_FOV * Math.PI / 360);
  const halfW = CARD_SIZE.width / 2;
  const halfH = CARD_SIZE.height / 2;
  const widthBound = 0.84 * tan * aspect;
  const heightBound = 0.7 * tan;
  return Math.min(
    widthBound * distance / (halfW + widthBound * halfH * pitch),
    heightBound * distance / (halfH * vertical + heightBound * halfH * pitch),
  );
}

// Facing (toward a camera at this angle) and screen-right directions for a camera orbiting an axis.
const around = (angle: number) => ({ front: [Math.sin(angle), 0, Math.cos(angle)] as V3, right: [Math.cos(angle), 0, -Math.sin(angle)] as V3 });

export type Neuron = { layer: number; index: number; position: V3; project: number | null };
export type Synapse = { from: Neuron; to: Neuron; signal: boolean };

// Layers from the input layer (-1) through the output layer (STOP_COUNT), left to right. In a stop's layer the first
// neurons are its projects, stacked down the front of the ring at the heights their cards sit at; the rest are spread
// around the back, nudged alternately each layer so synapses fan out instead of running in parallel.
export function networkLayers(aspect: number): Neuron[][] {
  const { height, depth } = networkFrame(aspect);
  const at = (layer: number, angle: number): V3 => [layerX(layer), NETWORK.y + Math.sin(angle) * height, NETWORK.axisZ + Math.cos(angle) * depth];
  const layers: Neuron[][] = [];
  for (let layer = -1; layer <= STOP_COUNT; layer++) {
    const stop = layer >= 0 && layer < STOP_COUNT ? STOPS[layer] : null;
    const size = stop ? Math.max(NETWORK.perLayer, stop.members.length + 3) : NETWORK.edgeLayer;
    const stagger = ((layer % 2 === 0 ? 1 : -1) * Math.PI) / size / 2;
    const neurons: Neuron[] = [];
    let reach = 0;
    stop?.members.forEach((project, slot) => {
      const angle = Math.asin(slotPlace(slot, stop.members.length, aspect).neuronY / height);
      reach = Math.max(reach, Math.abs(angle));
      neurons.push({ layer, index: slot, position: at(layer, angle), project });
    });
    const rest = size - neurons.length;
    const start = stop ? reach + 0.6 : 0;
    const arc = stop ? Math.PI * 2 - 2 * start : Math.PI * 2;
    for (let k = 0; k < rest; k++) {
      const angle = stop ? start + ((k + 1) * arc) / (rest + 1) + stagger : (k * arc) / rest + stagger;
      neurons.push({ layer, index: neurons.length, position: at(layer, angle), project: null });
    }
    layers.push(neurons);
  }
  return layers;
}

// Every neuron links down to its nearest neurons in the next layer (three for a project), every neuron after the input
// layer gets at least one link from before, and each project sends a signal to the nearest project in the next stop.
export function networkSynapses(layers: Neuron[][]): Synapse[] {
  const synapses: Synapse[] = [];
  const byKey = new Map<string, Synapse>();
  const add = (from: Neuron, to: Neuron, signal = false) => {
    const key = `${from.layer}:${from.index}>${to.layer}:${to.index}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.signal ||= signal;
      return;
    }
    const synapse = { from, to, signal };
    byKey.set(key, synapse);
    synapses.push(synapse);
  };
  const apart = (a: Neuron, b: Neuron) => Math.hypot(a.position[1] - b.position[1], a.position[2] - b.position[2]);
  const nearest = (neuron: Neuron, candidates: Neuron[]) => [...candidates].sort((a, b) => apart(neuron, a) - apart(neuron, b));
  for (let l = 0; l < layers.length - 1; l++) {
    const next = layers[l + 1];
    const reached = new Set<number>();
    for (const neuron of layers[l]) {
      for (const target of nearest(neuron, next).slice(0, neuron.project === null ? 2 : 3)) {
        add(neuron, target);
        reached.add(target.index);
      }
    }
    for (const target of next) {
      if (!reached.has(target.index)) add(nearest(target, layers[l])[0], target);
    }
  }
  for (let l = 1; l < layers.length - 2; l++) {
    const targets = layers[l + 1].filter(neuron => neuron.project !== null);
    for (const neuron of layers[l].filter(item => item.project !== null)) add(neuron, nearest(neuron, targets)[0], true);
  }
  return synapses;
}

export function milestonePlacement(index: number, aspect: number) {
  const y = STAIRS.base + index * STAIRS.spacing;
  const { front, right } = around(stairsViewAngleAt(y));
  const edge: V3 = [front[0] * STAIRS.outer, y, AXIS_Z + front[2] * STAIRS.outer];
  const finalChapter = index === MILESTONE_COUNT - 1;
  const pose = finalChapter ? landingPose() : spiralPose(index);
  // The card is on the sightline at every stop, including the level, straight final approach.
  const card = pose.target;
  const eye = pose.position;
  const towardEye = [eye[0] - card[0], 0, eye[2] - card[2]] as V3;
  const length = Math.hypot(towardEye[0], towardEye[2]);
  const normal: V3 = [towardEye[0] / length, 0, towardEye[2] / length];
  return { edge, card, front, right, normal, scale: milestoneScale(eye, card, aspect) };
}

export function projectPlacement(index: number, aspect: number) {
  const frame = networkFrame(aspect);
  const { stop, slot, size } = stopOf(index);
  const { side, rowY, neuronY } = slotPlace(slot, size, aspect);
  const node: V3 = [layerX(stop), NETWORK.y + neuronY, NETWORK.axisZ + Math.cos(Math.asin(neuronY / frame.height)) * frame.depth];
  // On its side of the spine in its row, all of a stop's cards in one plane slightly in front of the ring.
  const card: V3 = [node[0] + side * frame.reach, NETWORK.y + rowY, NETWORK.axisZ + frame.depth + 0.6];
  return { node, card, front: [0, 0, 1] as V3, right: [1, 0, 0] as V3, stop, slot, side, scale: frame.cardScale };
}

// How close the camera must be for the last card to cover the whole view, with a little to spare.
export function diveDistance(aspect: number) {
  const { scale } = milestonePlacement(MILESTONE_COUNT - 1, aspect);
  const tan = Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));
  return 0.9 * Math.min((CARD_SIZE.height * scale) / (2 * tan), (CARD_SIZE.width * scale) / (2 * tan * aspect));
}

function spiralPose(milestone: number): Pose {
  const frame = stairsFrame();
  const y = STAIRS.base + milestone * STAIRS.spacing;
  const { front, right } = around(stairsViewAngleAt(y));
  const lookProgress = milestone + frame.lookLead;
  const lookPathY = STAIRS.base + lookProgress * STAIRS.spacing;
  const lookY = lookPathY + frame.lookLift;
  const look = around(stairsViewAngleAt(lookPathY)).front;
  // Strafe the entire view rig toward the right half of the tread. Applying the same offset to the eye and target keeps
  // the forward angle and downward pitch unchanged while placing the viewer away from the left edge of the stairs.
  const shiftX = right[0] * frame.eyeShift;
  const shiftZ = right[2] * frame.eyeShift;
  return {
    position: [front[0] * frame.eyeRadius + shiftX, y + frame.eyeHeight, AXIS_Z + front[2] * frame.eyeRadius + shiftZ],
    target: [look[0] * frame.lookRadius + shiftX, lookY, AXIS_Z + look[2] * frame.lookRadius + shiftZ],
  };
}

function stairsPose(s: number): Pose {
  const milestone = timelinePosition(s);
  const last = MILESTONE_COUNT - 1;
  // Unwind the turn and raise the sightline while taking the last few steps onto the landing.
  return blend(spiralPose(milestone), landingPose(), smoothRange(last - 0.28, last, milestone));
}

export function divePose(aspect: number): Pose {
  const { card, normal } = milestonePlacement(MILESTONE_COUNT - 1, aspect);
  const distance = diveDistance(aspect);
  return { position: [card[0] + normal[0] * distance, card[1], card[2] + normal[2] * distance], target: card };
}

function throughCardPose(aspect: number): Pose {
  const { card, normal } = milestonePlacement(MILESTONE_COUNT - 1, aspect);
  return {
    position: [card[0] - normal[0] * 2, card[1], card[2] - normal[2] * 2],
    target: [card[0] - normal[0] * 5, card[1], card[2] - normal[2] * 5],
  };
}

function networkPose(s: number, aspect: number): Pose {
  const frame = networkFrame(aspect);
  const x = layerX(workPosition(s));
  return {
    position: [x - frame.lead, NETWORK.y + frame.lift, NETWORK.axisZ + frame.distance],
    target: [x + frame.shift, NETWORK.y + frame.aim, NETWORK.axisZ],
  };
}

const blend = (a: Pose, b: Pose, t: number): Pose => ({
  position: [a.position[0] + (b.position[0] - a.position[0]) * t, a.position[1] + (b.position[1] - a.position[1]) * t, a.position[2] + (b.position[2] - a.position[2]) * t],
  target: [a.target[0] + (b.target[0] - a.target[0]) * t, a.target[1] + (b.target[1] - a.target[1]) * t, a.target[2] + (b.target[2] - a.target[2]) * t],
});

// The camera's position and look-at point, a chain of eased moves: hero to stairs, down the stairs, dive into the last
// card, through it to the network, right along the network, then on to the close.
export function cameraPoseAt(s: number, aspect: number): Pose {
  const hero: Pose = { position: [0, 0, HERO.z + HERO.distance], target: [0, 0, HERO.z] };
  if (s < TRANSITION.dive[0]) return blend(hero, stairsPose(s), smoothRange(0.45, WINDOWS.timeline[0], s));
  if (s < TRANSITION.through[0]) return blend(stairsPose(s), divePose(aspect), smoothRange(TRANSITION.dive[0], TRANSITION.dive[1], s));
  if (s < TRANSITION.through[1]) return blend(divePose(aspect), throughCardPose(aspect), smoothRange(TRANSITION.through[0], TRANSITION.through[1], s));
  if (s < WINDOWS.work[0]) return blend(throughCardPose(aspect), networkPose(s, aspect), smoothRange(TRANSITION.through[1], WINDOWS.work[0], s));
  if (s < WINDOWS.work[1]) return networkPose(s, aspect);
  const close: Pose = { position: [CLOSE.x, CLOSE.y, CLOSE.z + CLOSE.distance], target: [CLOSE.x, CLOSE.y, CLOSE.z] };
  return blend(networkPose(s, aspect), close, smoothRange(WINDOWS.work[1], WINDOWS.close, s));
}

// Each milestone appears as the viewer approaches its landing, then gives way to the next. The final card holds for
// the transition until it fills the screen and dissolves.
export function milestoneReveal(index: number, s: number) {
  // Late in the arrival, so the cards appear once the stairs have formed rather than floating in mid-transition,
  // and never before the section copy has burned off the screen.
  const afterCopy = smoothRange(1 + TIMELINE_COPY[3], WINDOWS.timeline[0], s);
  const arrival = afterCopy * smoothRange(0.6, 0.97, smoothRange(0.45, WINDOWS.timeline[0], s));
  const nearby = 1 - smoothRange(0.42, 0.82, Math.abs(timelinePosition(s) - index));
  const visible = arrival * nearby;
  if (index === MILESTONE_COUNT - 1) return visible * (1 - smoothRange(TRANSITION.dissolve[0], TRANSITION.dissolve[1], s));
  return visible * (1 - smoothRange(TRANSITION.dive[0], TRANSITION.dive[0] + 0.08, s));
}

// Only the last card uses the noise dissolve, from the start of the dive; the rest simply fade.
export const milestoneDissolve = (index: number, s: number) => (index === MILESTONE_COUNT - 1 && s >= TRANSITION.dive[0] ? 1 : 0);

// A stop's cards show together while the camera is at that stop, each a beat after the one above, and fade as the
// camera moves on. None appear until the work copy has left the screen.
export function projectReveal(index: number, s: number) {
  const afterCopy = smoothRange(2 + WORK_COPY[3], WINDOWS.work[0], s);
  const { stop, slot } = stopOf(index);
  const away = Math.abs(workPosition(s) - stop) + slot * 0.08;
  return beatWeights(s).work * afterCopy * (1 - smoothRange(0.4, 1, away));
}

// Where the navigation links land, as a section and a fraction of the way through it: About on its opening words,
// Work with "What are you looking for?" on screen, and Contact at the end of the page.
export const NAV_ANCHORS = {
  about: { section: 1, at: (TIMELINE_COPY[1] + TIMELINE_COPY[2]) / 2 },
  work: { section: 2, at: (WORK_COPY[1] + WORK_COPY[2]) / 2 },
  contact: { section: LAST_SCENE, at: 1 },
} as const;

// How visible a section's copy is at scene coordinate s. The timeline copy steps aside early so the staircase has the
// screen, and the work copy plays while the network forms, before the first stop.
const COPY_WINDOWS: Record<number, readonly [number, number, number, number]> = {
  1: TIMELINE_COPY,
  2: WORK_COPY,
};

// The heading arrives as one complete thought, with a small stagger between its two lines. The next scroll beat
// brings in the final phrase and settles the copy toward the middle. Fractions of the final section.
export const CLOSING = { lines: [[0.38, 0.48], [0.58, 0.68]], settle: [0.8, 0.9] } as const;
// Stop beyond both heading reveals, leaving a clear pause before the answer. Keep the last stop at the page end
// so reaching it never leaves a redundant final stretch of scrolling.
export const CLOSING_STOPS = [LAST_SCENE + 0.72, LAST_SCENE + 1] as const;
export const closingLine = (index: number, s: number) => smoothRange(LAST_SCENE + CLOSING.lines[index][0], LAST_SCENE + CLOSING.lines[index][1], s);
// How many of the closing lines have started arriving, so each one decodes on its own beat instead of together.
export const closingStep = (s: number) => CLOSING.lines.filter(([start]) => s >= LAST_SCENE + start).length;
export const closingReveal = (s: number) => smoothRange(LAST_SCENE + CLOSING.settle[0], LAST_SCENE + CLOSING.settle[1], s);

// How far through its burn-off a section's copy is, 0 to 1: the exit half of copyVisibility, which the page uses to
// lift, blur and flare the words as they go.
export function copyBurn(index: number, s: number, lastIndex: number) {
  if (index === lastIndex) return 0;
  const local = s - index;
  if (index === 0) return smoothRange(0.35, 0.6, local);
  const [, , exitStart, exitEnd] = COPY_WINDOWS[index] ?? [0.08, 0.3, 0.68, 0.9];
  return smoothRange(exitStart, exitEnd, local);
}

export function copyVisibility(index: number, s: number, lastIndex: number) {
  const local = s - index;
  if (index === 0) return 1 - smoothRange(0.35, 0.6, local);
  const [enterStart, enterEnd, exitStart, exitEnd] = COPY_WINDOWS[index] ?? [0.08, 0.3, 0.68, 0.9];
  const enter = smoothRange(enterStart, enterEnd, local);
  const exit = index === lastIndex ? 1 : 1 - smoothRange(exitStart, exitEnd, local);
  return enter * exit;
}
