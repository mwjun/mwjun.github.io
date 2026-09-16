import { AXIS_Z, CARD_COUNT, CLOSE, HERO, MILESTONE_COUNT, NETWORK, STAIRS, STOP_COUNT, layerX, networkFrame, networkLayers, networkSynapses, projectPlacement, stairsAngleAt, type ShapeName } from "./timeline";

// Particle targets for each scene. Every shape is count records of x, y, z and brightness, packed for a float texture.

const AMBIENT_WORDS = ["REACT", "PYTHON", "AWS", "TYPESCRIPT", "PYTORCH", "NODE.JS", "DOCKER", "SQL", "LLMS", "TERRAFORM"];
const VIEW_HEIGHT = 2 * HERO.distance * Math.tan((25 * Math.PI) / 180);

type Rng = () => number;
type V3 = readonly [number, number, number];

export function seeded(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Mask = { points: Float32Array; aspect: number; cell: number; area: number };
const masks = new Map<string, Mask>();

// Rasterizes text once and keeps its lit pixels, measured in units of the text's width and centered on the origin.
function textMask(text: string, weight: number): Mask {
  const key = `${weight} ${text}`;
  const cached = masks.get(key);
  if (cached) return cached;
  const size = 140;
  const font = `${weight} ${size}px "Space Grotesk", "Helvetica Neue", Arial, sans-serif`;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { points: new Float32Array([0, 0]), aspect: 0.2, cell: 0.01, area: 0.0001 };
  context.font = font;
  const width = Math.ceil(context.measureText(text).width + size * 0.2);
  const height = Math.ceil(size * 1.25);
  canvas.width = width;
  canvas.height = height;
  context.font = font;
  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, width / 2, height / 2 + size * 0.04);
  const pixels = context.getImageData(0, 0, width, height).data;
  const step = 2;
  const lit: number[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (pixels[(y * width + x) * 4 + 3] > 128) lit.push(x / width - 0.5, (height / 2 - y) / width);
    }
  }
  const cell = step / width;
  const mask = { points: new Float32Array(lit.length ? lit : [0, 0]), aspect: height / width, cell, area: (lit.length / 2) * cell * cell };
  masks.set(key, mask);
  return mask;
}

class ShapeWriter {
  readonly data: Float32Array;
  private readonly count: number;
  private index = 0;

  constructor(count: number) {
    this.count = count;
    this.data = new Float32Array(count * 4);
  }

  get remaining() {
    return this.count - this.index;
  }

  push(x: number, y: number, z: number, brightness: number) {
    if (this.index >= this.count) return;
    const offset = this.index++ * 4;
    this.data[offset] = x;
    this.data[offset + 1] = y;
    this.data[offset + 2] = z;
    this.data[offset + 3] = brightness;
  }

  // Shuffled so particles cross the screen on their way to a new shape instead of sliding over in order.
  finish(rng: Rng) {
    const { data } = this;
    for (let i = this.count - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      for (let k = 0; k < 4; k++) {
        const swap = data[i * 4 + k];
        data[i * 4 + k] = data[j * 4 + k];
        data[j * 4 + k] = swap;
      }
    }
    return data;
  }
}

function scatterText(writer: ShapeWriter, rng: Rng, text: string, weight: number, x: number, y: number, z: number, maxWidth: number, maxHeight: number, budget: number, depth = 0.35, brightness = 0.42) {
  const mask = textMask(text, weight);
  const scale = Math.min(maxWidth, maxHeight / mask.aspect);
  const lit = mask.points.length / 2;
  for (let k = 0; k < budget; k++) {
    const p = Math.floor(rng() * lit) * 2;
    writer.push(
      x + (mask.points[p] + (rng() - 0.5) * mask.cell) * scale,
      y + (mask.points[p + 1] + (rng() - 0.5) * mask.cell) * scale,
      z + (rng() - 0.5) * depth,
      brightness + rng() * 0.2,
    );
  }
}

function scatterBox(writer: ShapeWriter, rng: Rng, budget: number, x: number, y: number, halfWidth: number, halfHeight: number, near: number, far: number, dim: number, bright: number) {
  for (let k = 0; k < budget; k++) {
    writer.push(x + (rng() * 2 - 1) * halfWidth, y + (rng() * 2 - 1) * halfHeight, far + rng() * (near - far), dim + rng() * (bright - dim));
  }
}

// Points in a hollow cylinder around the shared axis, for atmosphere that stays clear of the camera.
function scatterShell(writer: ShapeWriter, rng: Rng, budget: number, axisZ: number, inner: number, outer: number, top: number, bottom: number, dim: number, bright: number) {
  for (let k = 0; k < budget; k++) {
    const angle = rng() * Math.PI * 2;
    const radius = inner + rng() * (outer - inner);
    writer.push(Math.sin(angle) * radius, bottom + rng() * (top - bottom), axisZ + Math.cos(angle) * radius, dim + rng() * (bright - dim));
  }
}

export function buildShapes(count: number, aspect: number): Record<ShapeName, Float32Array> {
  const W = VIEW_HEIGHT * aspect;
  const H = VIEW_HEIGHT;
  const wide = aspect >= 1;

  const word = (text: string, seed: number) => {
    const writer = new ShapeWriter(count);
    const rng = seeded(seed);
    scatterText(writer, rng, text, 700, 0, 0, HERO.z, W * 0.82, H * 0.3, Math.floor(count * 0.9));
    scatterBox(writer, rng, writer.remaining, 0, 0, W * 0.6, H * 0.45, 3, -6, 0.05, 0.2);
    return writer.finish(rng);
  };

  // A loose field of stray tech terms, purely decorative background for the opening gather.
  const galaxy = () => {
    const writer = new ShapeWriter(count);
    const rng = seeded(3);
    const placed = AMBIENT_WORDS.map(text => {
      const z = 6 - rng() * 30;
      const reach = 0.6 + ((6 - z) / 30) * 1.2;
      let x = (rng() * 2 - 1) * W * 0.5 * reach;
      const y = (rng() * 2 - 1) * H * 0.42 * reach;
      if (Math.abs(x) < W * 0.14 * reach && Math.abs(y) < H * 0.12 * reach) x = Math.sign(x || 1) * W * (0.14 + rng() * 0.2) * reach;
      const width = (1.4 + rng() * 2) * Math.min(1, 0.45 + aspect * 0.55);
      return { text, x, y, z, width, area: textMask(text, 600).area * width * width };
    });
    const total = placed.reduce((sum, item) => sum + item.area, 0);
    const budget = count * 0.55;
    placed.forEach(item => scatterText(writer, rng, item.text, 600, item.x, item.y, item.z, item.width, item.width, Math.floor((budget * item.area) / total), 0.2));
    scatterBox(writer, rng, writer.remaining, 0, 0, W * 1.2, H, 8, -30, 0.04, 0.22);
    return writer.finish(rng);
  };

  // Where a connector meets a card: the middle of the edge that faces its neuron.
  const cardEdge = (place: { card: V3; right: V3; side: number; scale: number }): V3 => [place.card[0] - place.side * place.right[0] * 1.72 * place.scale, place.card[1], place.card[2] - place.side * place.right[2] * 1.72 * place.scale];

  const link = (writer: ShapeWriter, rng: Rng, from: V3, to: V3, budget: number) => {
    for (let k = 0; k < budget; k++) {
      const t = 0.12 + rng() * 0.88;
      writer.push(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + (rng() - 0.5) * 0.02, from[2] + (to[2] - from[2]) * t, 0.22 + rng() * 0.2);
    }
  };

  // A glowing ring standing in the view plane, marking the point a card belongs to.
  const marker = (writer: ShapeWriter, rng: Rng, at: V3, right: V3, budget: number) => {
    for (let k = 0; k < budget; k++) {
      const t = rng() * Math.PI * 2;
      const ring = k % 3 === 0 ? rng() * 0.12 : 0.34 + (rng() - 0.5) * 0.05;
      writer.push(at[0] + right[0] * Math.cos(t) * ring, at[1] + Math.sin(t) * ring, at[2] + right[2] * Math.cos(t) * ring, 0.55 + rng() * 0.3);
    }
  };

  // The career staircase: wedge-shaped treads winding down the axis, a railing with balusters, and a slim center column.
  // Milestone cards hang on the front of their steps, so no markers or connectors are needed.
  const staircase = () => {
    const writer = new ShapeWriter(count);
    const rng = seeded(13);
    const top = STAIRS.top + 3;
    const bottom = STAIRS.top - (MILESTONE_COUNT - 1) * STAIRS.spacing - 3;
    const steps = Math.floor((top - bottom) / STAIRS.stepHeight);
    const stepArc = ((STAIRS.turn + Math.PI * 2) * STAIRS.stepHeight) / STAIRS.spacing;
    const depth = STAIRS.outer - STAIRS.inner;

    for (let k = Math.floor(count * 0.56); k > 0; k--) {
      const y = top - Math.floor(rng() * steps) * STAIRS.stepHeight;
      const along = rng();
      const angle = stairsAngleAt(y) + along * stepArc * 0.9;
      const r = STAIRS.inner + rng() * depth;
      // The nosing and the outer rim catch the most light, so each tread reads as a solid step.
      const edge = Math.max(1 - along * 7, (r - STAIRS.inner) / depth > 0.94 ? 0.75 : 0);
      writer.push(Math.sin(angle) * r, y + (rng() - 0.5) * 0.03, AXIS_Z + Math.cos(angle) * r, 0.22 + edge * 0.45 + rng() * 0.08);
    }

    for (let k = Math.floor(count * 0.12); k > 0; k--) {
      const y = bottom + rng() * (top - bottom);
      const angle = stairsAngleAt(y);
      writer.push(Math.sin(angle) * STAIRS.rail, y + 0.9 + (rng() - 0.5) * 0.03, AXIS_Z + Math.cos(angle) * STAIRS.rail, 0.42 + rng() * 0.18);
    }

    for (let k = Math.floor(count * 0.05); k > 0; k--) {
      const y = top - Math.floor(rng() * (steps / 2)) * STAIRS.stepHeight * 2;
      const angle = stairsAngleAt(y) + stepArc * 0.5;
      writer.push(Math.sin(angle) * STAIRS.rail, y + rng() * 0.9, AXIS_Z + Math.cos(angle) * STAIRS.rail, 0.2 + rng() * 0.14);
    }

    for (let k = Math.floor(count * 0.04); k > 0; k--) {
      const angle = rng() * Math.PI * 2;
      const r = 0.3 + rng() * 0.12;
      writer.push(Math.sin(angle) * r, bottom + rng() * (top - bottom), AXIS_Z + Math.cos(angle) * r, 0.1 + rng() * 0.12);
    }

    scatterShell(writer, rng, writer.remaining, AXIS_Z, 5.6, 12, top + 4, bottom - 4, 0.03, 0.1);
    return writer.finish(rng);
  };

  // The project work as a neural network running left to right: a ring of neurons for each layer, synapses from each
  // neuron to its nearest neurons in the next layer with pulses of light running along them, and a faint ring tracing
  // each layer. Each project is a larger neuron with a ring, on a denser signal path to the next stop, with a connector
  // out to its card.
  const network = () => {
    const writer = new ShapeWriter(count);
    const rng = seeded(29);
    const layers = networkLayers(aspect);
    const synapses = networkSynapses(layers);
    const neurons = layers.flat();
    const { height, depth } = networkFrame(aspect);

    // Synapse particles carry brightness 2 + pulse group + how far down the synapse they sit, which the shader turns
    // into a travelling pulse. The signal path between projects gets three times the density.
    const lengthOf = ({ from, to }: (typeof synapses)[number]) => Math.hypot(to.position[0] - from.position[0], to.position[1] - from.position[1], to.position[2] - from.position[2]);
    const weightOf = (synapse: (typeof synapses)[number]) => lengthOf(synapse) * (synapse.signal ? 3 : 1);
    const totalWeight = synapses.reduce((sum, synapse) => sum + weightOf(synapse), 0);
    const synapseBudget = count * 0.52;
    synapses.forEach((synapse, i) => {
      const { from, to } = synapse;
      const group = i % 48;
      for (let k = Math.floor((synapseBudget * weightOf(synapse)) / totalWeight); k > 0; k--) {
        const t = rng();
        writer.push(
          from.position[0] + (to.position[0] - from.position[0]) * t + (rng() - 0.5) * 0.03,
          from.position[1] + (to.position[1] - from.position[1]) * t + (rng() - 0.5) * 0.03,
          from.position[2] + (to.position[2] - from.position[2]) * t + (rng() - 0.5) * 0.03,
          2 + group + t * 0.999,
        );
      }
    });

    // Neurons: a tight bright cluster each, larger and denser for projects.
    const perNeuron = Math.floor((count * 0.2) / (neurons.length + CARD_COUNT * 2));
    for (const neuron of neurons) {
      const project = neuron.project !== null;
      const size = project ? 0.19 : 0.11;
      for (let k = perNeuron * (project ? 3 : 1); k > 0; k--) {
        const theta = rng() * Math.PI * 2;
        const cosine = rng() * 2 - 1;
        const r = size * Math.cbrt(rng());
        const ring = Math.sqrt(1 - cosine * cosine) * r;
        writer.push(neuron.position[0] + Math.cos(theta) * ring, neuron.position[1] + cosine * r, neuron.position[2] + Math.sin(theta) * ring, project ? 0.78 + rng() * 0.22 : 0.5 + rng() * 0.3);
      }
    }

    for (let k = Math.floor(count * 0.04); k > 0; k--) {
      const layer = Math.floor(rng() * layers.length);
      const angle = rng() * Math.PI * 2;
      const wobble = 1 + (rng() - 0.5) * 0.02;
      writer.push(layers[layer][0].position[0], NETWORK.y + Math.sin(angle) * height * wobble, NETWORK.axisZ + Math.cos(angle) * depth * wobble, 0.05 + rng() * 0.06);
    }

    const perRing = Math.floor((count * 0.04) / CARD_COUNT);
    const perLink = Math.floor((count * 0.03) / CARD_COUNT);
    for (let i = 0; i < CARD_COUNT; i++) {
      const place = projectPlacement(i, aspect);
      marker(writer, rng, place.node, place.right, perRing);
      link(writer, rng, place.node, cardEdge(place), perLink);
    }

    // Dust in a tube around the network's axis, clear of the layer rings.
    const left = layerX(-1) - 8;
    const right = layerX(STOP_COUNT) + 8;
    while (writer.remaining > 0) {
      const angle = rng() * Math.PI * 2;
      const r = height + 1.8 + rng() * 8;
      writer.push(left + rng() * (right - left), NETWORK.y + Math.sin(angle) * r, NETWORK.axisZ + Math.cos(angle) * r * 0.8, 0.03 + rng() * 0.09);
    }
    return writer.finish(rng);
  };

  const monogram = () => {
    const writer = new ShapeWriter(count);
    const rng = seeded(17);
    const y = CLOSE.y + H * 0.12;
    scatterText(writer, rng, "MJ.", 700, CLOSE.x, y, CLOSE.z, wide ? W * 0.26 : W * 0.5, H * 0.28, Math.floor(count * 0.86), 0.35, 0.22);
    scatterBox(writer, rng, writer.remaining, CLOSE.x, y, W * 0.55, H * 0.45, CLOSE.z + 4, CLOSE.z - 8, 0.03, 0.12);
    return writer.finish(rng);
  };

  return {
    galaxy: galaxy(),
    complexity: word("COMPLEXITY", 7),
    possibility: word("POSSIBILITY", 11),
    network: network(),
    staircase: staircase(),
    monogram: monogram(),
  };
}
