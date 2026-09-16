import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { projects } from "@/data/projects";
import { AXIS_Z, CAMERA_FOV, CARD_COUNT, CARD_SIZE, INTRO, LAST_SCENE, MILESTONE_COUNT, MORPHS, NAV_ANCHORS, NETWORK, ORDERED_PROJECTS, PROJECT_CATEGORIES, STAIRS, STOPS, STOP_COUNT, TRANSITION, WINDOWS, ambientFlow, beatWeights, cameraPoseAt, categoryStop, copyVisibility, cursorRepel, introMorph, layerX, milestoneDissolve, milestonePlacement, milestoneReveal, morphAt, networkLayers, networkSynapses, projectPlacement, projectReveal, stopOf, stopScene, swirlFor } from "@/lab/timeline";

vi.mock("@/lab/engine", () => ({ createLabEngine: () => null }));
const { default: Test } = await import("@/pages/Test");

afterEach(cleanup);

type V3 = readonly [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3, scale = 1): V3 => [a[0] + b[0] * scale, a[1] + b[1] * scale, a[2] + b[2] * scale];
const unit = (v: V3): V3 => {
  const length = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / length, v[1] / length, v[2] / length];
};
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// Horizontal direction from the staircase's vertical axis to a point.
const aroundAxis = (point: V3) => unit([point[0], 0, point[2] - AXIS_Z]);
const fromAxis = (point: V3): V3 => [point[0], 0, point[2] - AXIS_Z];
const timelineAt = (index: number) => WINDOWS.timeline[0] + (index / (MILESTONE_COUNT - 1)) * (WINDOWS.timeline[1] - WINDOWS.timeline[0]);
const WIDE = 16 / 10;
const PHONE = 390 / 844;
const TAN = Math.tan((CAMERA_FOV / 2) * (Math.PI / 180));

// Where a point lands in the camera's view, with both coordinates between -1 and 1 when it is on screen.
function project(pose: { position: V3; target: V3 }, aspect: number, point: V3) {
  const forward = unit(sub(pose.target, pose.position));
  const right = unit(cross(forward, [0, 1, 0]));
  const up = cross(right, forward);
  const offset = sub(point, pose.position);
  const depth = dot(offset, forward);
  return { x: dot(offset, right) / (depth * TAN * aspect), y: dot(offset, up) / (depth * TAN), depth, right, up };
}

describe("Test page choreography", () => {
  it("chains every morph into the next and holds shapes between them", () => {
    MORPHS.slice(1).forEach((morph, i) => expect(morph.from).toBe(MORPHS[i].to));
    expect(morphAt(0)).toEqual({ from: "possibility", to: "possibility", mix: 0 });
    expect(morphAt(1.3)).toEqual({ from: "possibility", to: "staircase", mix: 1 });
    expect(morphAt(2.5)).toEqual({ from: "staircase", to: "network", mix: 1 });
    expect(morphAt(LAST_SCENE + 1).to).toBe("monogram");
  });

  it("keeps the particle swirl for the opening and the closing mark, and scrolls through the staircase and network without it", () => {
    expect(swirlFor(introMorph(1))).toBe(1);
    expect(swirlFor(introMorph(INTRO.turn[0] + 0.5))).toBe(1);
    expect(swirlFor(morphAt(0.7))).toBe(0);
    expect(swirlFor(morphAt(2))).toBe(0);
    expect(swirlFor(morphAt(3.1))).toBe(1);
    // The cursor only pushes particles aside on the opening word.
    expect(cursorRepel(0)).toBe(1);
    expect(cursorRepel(0.25)).toBe(1);
    for (const s of [0.5, 1.4, TRANSITION.dive[1], 2.5, LAST_SCENE + 1]) expect(cursorRepel(s)).toBe(0);
    expect(ambientFlow(0)).toBe(1);
    expect(ambientFlow(1.4)).toBeLessThan(0.3);
    expect(ambientFlow(2.5)).toBeLessThan(0.3);
    expect(ambientFlow(LAST_SCENE + 1)).toBe(1);
  });

  it("hands the camera between beats without ever losing or doubling it", () => {
    for (let s = 0; s <= LAST_SCENE + 1; s += 0.01) {
      const weights = beatWeights(s);
      expect(weights.hero + weights.timeline + weights.work + weights.close).toBeCloseTo(1, 9);
    }
  });

  it("orbits one full turn down the staircase with each milestone's large card centered on the front of its step", () => {
    for (const aspect of [WIDE, PHONE]) {
      let previousY = Infinity;
      for (let i = 0; i < MILESTONE_COUNT; i++) {
        const pose = cameraPoseAt(timelineAt(i), aspect);
        const { edge, card, front, scale } = milestonePlacement(i, aspect);
        expect(dot(aroundAxis(pose.position), aroundAxis(edge))).toBeGreaterThan(0.999);
        expect(pose.position[1]).toBeLessThan(previousY);
        previousY = pose.position[1];
        // Straight out from the axis on the camera's side, just past the rail, and dead center in the view.
        expect(dot(aroundAxis(card), front)).toBeGreaterThan(0.9999);
        expect(dot(fromAxis(card), front)).toBeGreaterThan(STAIRS.rail);
        expect(Math.abs(card[1] - edge[1])).toBeLessThan(1);
        expect(dot(unit(sub(pose.target, pose.position)), unit(sub(card, pose.position)))).toBeGreaterThan(0.99999);
        // Large, and clear of the cards on the steps above and below.
        const distance = Math.hypot(...sub(pose.position, card));
        const widthOfView = (CARD_SIZE.width * scale) / (2 * distance * TAN * aspect);
        expect(widthOfView).toBeGreaterThan(aspect >= 1 ? 0.5 : 0.85);
        expect(widthOfView).toBeLessThan(0.97);
        expect(STAIRS.spacing - CARD_SIZE.height * scale).toBeGreaterThan(0.5);
      }
    }
    // Cards turn with the stairs: only the current one squares up to the camera, its neighbors are angled away.
    for (let i = 1; i < MILESTONE_COUNT - 1; i++) {
      const pose = cameraPoseAt(timelineAt(i), WIDE);
      // Compared around the axis only; the camera looks slightly down on the steps.
      const toCamera = (index: number) => {
        const { card } = milestonePlacement(index, WIDE);
        const offset = sub(pose.position, card);
        return unit([offset[0], 0, offset[2]]);
      };
      expect(dot(milestonePlacement(i, WIDE).normal, toCamera(i))).toBeGreaterThan(0.9999);
      for (const neighbor of [i - 1, i + 1]) expect(dot(milestonePlacement(neighbor, WIDE).normal, toCamera(neighbor))).toBeLessThan(0.93);
    }
    const facing = (index: number) => aroundAxis(cameraPoseAt(timelineAt(index), WIDE).position);
    expect(dot(facing(0), [0, 0, 1])).toBeGreaterThan(0.999);
    expect(dot(facing((MILESTONE_COUNT - 1) / 2), [0, 0, -1])).toBeGreaterThan(0.99);
    expect(dot(facing(MILESTONE_COUNT - 1), [0, 0, 1])).toBeGreaterThan(0.999);
  });

  it("groups every project by category into stops of two or three, which the category links jump to", () => {
    expect(new Set(ORDERED_PROJECTS.map(project => project.title))).toEqual(new Set(projects.map(project => project.title)));
    expect(ORDERED_PROJECTS).toHaveLength(CARD_COUNT);
    expect(STOPS.flatMap(stop => stop.members)).toEqual(Array.from({ length: CARD_COUNT }, (_, i) => i));
    for (const stop of STOPS) {
      const inCategory = ORDERED_PROJECTS.filter(project => project.category === stop.category).length;
      expect(stop.members.length).toBeLessThanOrEqual(3);
      if (inCategory >= 2) expect(stop.members.length).toBeGreaterThanOrEqual(2);
      for (const index of stop.members) expect(ORDERED_PROJECTS[index].category).toBe(stop.category);
    }
    for (const category of PROJECT_CATEGORIES) {
      const first = categoryStop(category);
      expect(STOPS[first].category).toBe(category);
      expect(STOPS.slice(0, first).some(stop => stop.category === category)).toBe(false);
      // A category's stops are consecutive.
      const indices = STOPS.map((stop, i) => (stop.category === category ? i : -1)).filter(i => i >= 0);
      expect(indices).toEqual(Array.from({ length: indices.length }, (_, i) => first + i));
      // Jumping there centers the camera on that stop with all its cards showing.
      const s = stopScene(first);
      const pose = cameraPoseAt(s, WIDE);
      expect(Math.abs(pose.target[0] - layerX(first))).toBeLessThan(NETWORK.spacing / 2);
      for (const index of STOPS[first].members) expect(projectReveal(index, s)).toBeCloseTo(1);
    }
  });

  it("pans left to right from stop to stop, with each stop's large cards beside their neurons and fully in view", () => {
    for (const aspect of [WIDE, PHONE]) {
      let previousX = -Infinity;
      const level = cameraPoseAt(stopScene(0), aspect).position[1];
      STOPS.forEach((stop, s) => {
        const pose = cameraPoseAt(stopScene(s), aspect);
        expect(pose.position[0]).toBeGreaterThan(previousX);
        previousX = pose.position[0];
        expect(pose.position[1]).toBeCloseTo(level);
        const places = stop.members.map(index => projectPlacement(index, aspect));
        places.forEach((place, slot) => {
          const halfWidth = (CARD_SIZE.width / 2) * place.scale;
          const halfHeight = (CARD_SIZE.height / 2) * place.scale;
          expect(place.node[0]).toBe(layerX(s));
          // On its own side of the spine, clear of the neurons, and clear of the next and previous stops' cards.
          expect(place.side * (place.card[0] - place.node[0]) - halfWidth).toBeGreaterThan(0.3);
          expect(Math.abs(place.card[0] - place.node[0]) + halfWidth).toBeLessThan(NETWORK.spacing / 2 - 0.3);
          expect(Math.abs(place.card[1] - place.node[1])).toBeLessThan(halfHeight);
          if (aspect < 1) expect(place.side).toBe(1);
          // No two cards in a stop touch.
          for (const other of places.slice(slot + 1)) {
            const apartX = Math.abs(other.card[0] - place.card[0]) - 2 * halfWidth;
            const apartY = Math.abs(other.card[1] - place.card[1]) - 2 * halfHeight;
            expect(Math.max(apartX, apartY)).toBeGreaterThan(0.1);
          }
          // Every corner of the card, which turns to face the camera, is on screen, and so is its neuron.
          const { right, up } = project(pose, aspect, place.card);
          for (const [sx, sy] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            const corner = project(pose, aspect, add(add(place.card, right, sx * halfWidth), up, sy * halfHeight));
            expect(Math.abs(corner.x)).toBeLessThan(1);
            expect(Math.abs(corner.x)).toBeLessThan(1);
            // Below the site header, which covers the top tenth of a desktop view.
            expect(corner.y).toBeLessThan(aspect >= 1 ? 0.75 : 0.8);
            expect(corner.y).toBeGreaterThan(-1);
          }
          const neuron = project(pose, aspect, place.node);
          expect(Math.abs(neuron.x)).toBeLessThan(1);
          expect(Math.abs(neuron.y)).toBeLessThan(1);
          // Large: a wide card spans over a third of a desktop view and most of a phone's.
          const distance = pose.position[2] - place.card[2];
          expect((2 * halfWidth) / (2 * distance * TAN * aspect)).toBeGreaterThan(aspect >= 1 ? 0.35 : 0.7);
        });
        // Every card of the stop shows while the camera is there.
        for (const index of stop.members) expect(projectReveal(index, stopScene(s))).toBeCloseTo(1);
      });
    }
    expect(NETWORK.y).toBeLessThan(STAIRS.top - (MILESTONE_COUNT - 1) * STAIRS.spacing);
  });

  it("wires the network layer to layer, reaches every neuron, and sends a signal from each project to the next stop", () => {
    for (const aspect of [WIDE, PHONE]) {
      const layers = networkLayers(aspect);
      const synapses = networkSynapses(layers);
      expect(layers).toHaveLength(STOP_COUNT + 2);
      layers.forEach((layer, l) => {
        for (const neuron of layer) expect(neuron.position[0]).toBe(layerX(l - 1));
      });
      // Each stop's layer holds exactly its projects, at the points their cards are placed from.
      STOPS.forEach((stop, s) => {
        const here = layers[s + 1].filter(neuron => neuron.project !== null);
        expect(here.map(neuron => neuron.project)).toEqual(stop.members);
        for (const neuron of here) expect(Math.hypot(...sub(neuron.position, projectPlacement(neuron.project ?? -1, aspect).node))).toBeLessThan(1e-9);
      });
      expect(layers.flat().filter(neuron => neuron.project !== null)).toHaveLength(CARD_COUNT);
      // Synapses only run one layer on, never repeat, and leave no neuron unreached or without a way out.
      const keys = new Set(synapses.map(({ from, to }) => `${from.layer}:${from.index}>${to.layer}:${to.index}`));
      expect(keys.size).toBe(synapses.length);
      for (const { from, to } of synapses) expect(to.layer).toBe(from.layer + 1);
      for (const neuron of layers.slice(1).flat()) expect(synapses.some(({ to }) => to === neuron)).toBe(true);
      for (const neuron of layers.slice(0, -1).flat()) expect(synapses.some(({ from }) => from === neuron)).toBe(true);
      const signal = synapses.filter(synapse => synapse.signal);
      expect(signal).toHaveLength(CARD_COUNT - STOPS[STOP_COUNT - 1].members.length);
      for (const { from, to } of signal) {
        expect(from.project).not.toBeNull();
        expect(to.project).not.toBeNull();
        expect(stopOf(to.project ?? -1).stop).toBe(stopOf(from.project ?? -1).stop + 1);
      }
    }
  });

  it("dives into the last chapter until it fills the screen, dissolves it, then goes through it to the network", () => {
    const last = MILESTONE_COUNT - 1;
    for (const aspect of [WIDE, PHONE]) {
      const { card, normal, scale } = milestonePlacement(last, aspect);
      const full = cameraPoseAt(TRANSITION.dive[1], aspect);
      const toCamera = sub(full.position, card);
      const distance = Math.hypot(...toCamera);
      expect(dot(unit(toCamera), normal)).toBeGreaterThan(0.9999);
      expect(Math.hypot(...sub(full.target, card))).toBeLessThan(1e-9);
      // The card is taller and wider than the view at that distance.
      expect((CARD_SIZE.height * scale) / 2).toBeGreaterThan(distance * TAN);
      expect((CARD_SIZE.width * scale) / 2).toBeGreaterThan(distance * TAN * aspect);

      // Only after the card has dissolved does the camera cross its plane, and it keeps moving forward to the network.
      let previousZ = full.position[2];
      for (let s = TRANSITION.through[0]; s <= TRANSITION.through[1]; s += 0.005) {
        const pose = cameraPoseAt(s, aspect);
        if (dot(sub(pose.position, card), normal) < 0) expect(milestoneReveal(last, s)).toBe(0);
        expect(pose.position[2]).toBeLessThanOrEqual(previousZ + 1e-9);
        previousZ = pose.position[2];
      }
      expect(dot(sub(cameraPoseAt(TRANSITION.through[1], aspect).position, card), normal)).toBeLessThan(0);
    }
    expect(milestoneReveal(last, TRANSITION.dive[1])).toBe(1);
    expect(milestoneDissolve(last, TRANSITION.dive[1])).toBe(1);
    expect(milestoneDissolve(last - 1, TRANSITION.dive[1])).toBe(0);
    expect(milestoneReveal(last - 1, TRANSITION.dive[1])).toBe(0);
    expect(milestoneReveal(last, TRANSITION.dissolve[1])).toBe(0);
    // The staircase turns into the network behind the full-screen card.
    expect(morphAt(TRANSITION.dissolve[0]).to).toBe("network");
    expect(morphAt(TRANSITION.dive[1] - 0.03)).toMatchObject({ to: "staircase", mix: 1 });
  });

  it("keeps every milestone card on its step through the climb, shows a stop at a time, and never both beats at once", () => {
    for (let i = 0; i < MILESTONE_COUNT; i++) {
      for (let j = 0; j < MILESTONE_COUNT; j++) expect(milestoneReveal(j, timelineAt(i))).toBe(1);
    }
    for (let i = 0; i < CARD_COUNT; i++) {
      const { stop } = stopOf(i);
      expect(projectReveal(i, stopScene(stop))).toBeCloseTo(1);
      if (stop + 1 < STOP_COUNT) expect(projectReveal(i, stopScene(stop + 1))).toBe(0);
      if (stop > 0) expect(projectReveal(i, stopScene(stop - 1))).toBe(0);
      expect(projectReveal(i, timelineAt(6))).toBe(0);
    }
    for (let j = 0; j < MILESTONE_COUNT; j++) expect(milestoneReveal(j, stopScene(0))).toBe(0);
  });

  it("steps the section copy aside so the staircase and network have the screen", () => {
    expect(copyVisibility(0, 0, LAST_SCENE)).toBe(1);
    expect(copyVisibility(1, 0, LAST_SCENE)).toBe(0);
    expect(copyVisibility(1, 1.05, LAST_SCENE)).toBe(1);
    expect(copyVisibility(1, 1.5, LAST_SCENE)).toBe(0);
    // The work copy stays hidden through the dive, shows while the network forms, and is gone before any project appears.
    expect(copyVisibility(2, TRANSITION.dive[1], LAST_SCENE)).toBe(0);
    expect(copyVisibility(2, 2.165, LAST_SCENE)).toBe(1);
    for (let s = 2; s <= LAST_SCENE + 1; s += 0.002) {
      for (let i = 0; i < CARD_COUNT; i++) expect(copyVisibility(2, s, LAST_SCENE) * projectReveal(i, s)).toBe(0);
    }
    expect(copyVisibility(LAST_SCENE, LAST_SCENE + 1, LAST_SCENE)).toBe(1);
  });
});

describe("Home navigation anchors", () => {
  it("lands About at the top of the staircase, Work on its question, and Contact at the end of the page", () => {
    const about = NAV_ANCHORS.about.section + NAV_ANCHORS.about.at;
    expect(copyVisibility(1, about, LAST_SCENE)).toBe(1);
    for (let i = 0; i < MILESTONE_COUNT; i++) expect(milestoneReveal(i, about)).toBe(1);
    const work = NAV_ANCHORS.work.section + NAV_ANCHORS.work.at;
    expect(copyVisibility(2, work, LAST_SCENE)).toBe(1);
    // The staircase is gone and no project cards have come in yet.
    for (let i = 0; i < MILESTONE_COUNT; i++) expect(milestoneReveal(i, work)).toBe(0);
    for (let i = 0; i < CARD_COUNT; i++) expect(projectReveal(i, work)).toBe(0);
    expect(NAV_ANCHORS.contact).toEqual({ section: LAST_SCENE, at: 1 });
  });

  it("gives each home section its navigation name and its anchor", () => {
    const { container } = render(<MemoryRouter><Test /></MemoryRouter>);
    expect([...container.querySelectorAll("[data-nav]")].map(element => (element as HTMLElement).dataset.nav)).toEqual(["story", "about", "work", "contact"]);
    for (const id of Object.keys(NAV_ANCHORS)) expect(container.querySelector(`#${id}`)?.closest("[data-nav]")).toHaveAttribute("data-nav", id);
  });
});

describe("Test page without WebGL", () => {
  it("falls back to readable copy, the full timeline and project list, and working links", () => {
    const { container } = render(<MemoryRouter><Test /></MemoryRouter>);
    expect(container.firstElementChild).toHaveClass("is-fallback");
    expect(container.querySelector(".lab-hud-scene")).toBeNull();
    expect(screen.getByRole("heading", { level: 1, name: "Complexity into possibility." })).toBeInTheDocument();
    for (const name of ["Every chapter built the next one.", "What are you looking for?", "How can I best serve you?"]) expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    expect(within(screen.getByRole("list", { name: "Career and education timeline" })).getAllByRole("listitem")).toHaveLength(MILESTONE_COUNT);
    expect(within(screen.getByRole("list", { name: "Projects" })).getAllByRole("listitem")).toHaveLength(CARD_COUNT);
    for (const category of PROJECT_CATEGORIES) expect(screen.getByRole("button", { name: category })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Tell me about it/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Email/ })).toHaveAttribute("href", "mailto:Jun.w.matthew@gmail.com");
    expect(screen.getByRole("link", { name: /Check my skillset/ })).toHaveAttribute("href", "/skills");
  });
});
