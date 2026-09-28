import { afterEach, describe, expect, it, vi } from "vitest";
import { createScrollGuide, createWheelIntent, STORY_STOPS } from "@/lab/scrollGuide";
import { CLOSING_STOPS, LAST_SCENE, MILESTONE_COUNT, STOP_COUNT, milestoneReveal, milestoneScene, projectReveal, STOPS, stopScene } from "@/lab/timeline";

const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup.splice(0).forEach(dispose => dispose());
  document.body.innerHTML = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
});

function harness(reducedMotion = false, initial = 0, cameraLag = 0) {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const root = document.createElement("main");
  document.body.append(root);
  let now = 0;
  let position = initial;
  let visiblePosition = initial;
  const visited: number[] = [];
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(id => { frames.delete(id); });
  const guide = createScrollGuide({ root, reducedMotion, scene: () => position, scrollToScene: s => { position = s; visited.push(s); }, renderedScene: () => cameraLag ? visiblePosition : position });
  cleanup.push(guide.dispose);
  const run = (duration: number) => {
    const end = now + duration;
    while (now < end) {
      const step = Math.min(16, end - now);
      now += step;
      vi.advanceTimersByTime(step);
      const callbacks = [...frames.values()];
      frames.clear();
      callbacks.forEach(callback => callback(now));
      visiblePosition += (position - visiblePosition) * (1 - Math.exp(-16 / (cameraLag || 1)));
    }
  };
  const wheel = (deltaY: number, extras: WheelEventInit = {}, target: HTMLElement = root) => {
    const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, deltaY, ...extras });
    target.dispatchEvent(event);
    return event;
  };
  const key = (key: string, target: HTMLElement = root, extras: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key, ...extras });
    target.dispatchEvent(event);
    return event;
  };
  const touch = (type: string, x: number, y: number, count = 1, cancelable = true) => {
    const event = new Event(type, { bubbles: true, cancelable });
    Object.defineProperty(event, "touches", { value: Array.from({ length: count }, () => ({ clientX: x, clientY: y })) });
    root.dispatchEvent(event);
    return event;
  };
  return { root, guide, run, wheel, key, touch, visited, visiblePosition: () => visiblePosition, position: () => position, externalScroll: (s: number) => {
    position = s;
    window.dispatchEvent(new Event("scroll"));
  } };
}

describe("guided story scrolling", () => {
  it("stops on every readable career card and project group, in order", () => {
    expect(STORY_STOPS[0]).toBe(0);
    expect(STORY_STOPS[STORY_STOPS.length - 1]).toBe(LAST_SCENE + 1);
    STORY_STOPS.slice(1).forEach((s, i) => expect(s).toBeGreaterThan(STORY_STOPS[i]));
    for (let i = 0; i < MILESTONE_COUNT; i++) {
      expect(STORY_STOPS).toContain(milestoneScene(i));
      expect(milestoneReveal(i, milestoneScene(i))).toBeCloseTo(1);
    }
    for (let i = 0; i < STOP_COUNT; i++) {
      expect(STORY_STOPS).toContain(stopScene(i));
      STOPS[i].members.forEach(project => expect(projectReveal(project, stopScene(i))).toBeCloseTo(1));
    }
  });

  it("advances once for a wheel gesture, filters its fading momentum, then stays put", () => {
    const page = harness();
    expect(page.wheel(120).defaultPrevented).toBe(true);
    for (let i = 1; i < 50; i++) {
      page.run(16);
      page.wheel(120 * 0.92 ** i);
    }
    page.run(1500);
    expect(page.position()).toBeCloseTo(STORY_STOPS[1]);
    page.run(5000);
    expect(page.position()).toBeCloseTo(STORY_STOPS[1]);
    // A new gesture after the first has finished advances exactly one more item.
    page.wheel(80);
    page.run(2000);
    expect(page.position()).toBeCloseTo(STORY_STOPS[2]);
  });

  it("bypasses intermediate stops while scrolling continuously, then settles at the nearest item", () => {
    const page = harness(false, milestoneScene(2));
    page.wheel(80);
    for (let i = 0; i < 30; i++) {
      page.run(30);
      page.wheel(80);
    }
    expect(page.position()).toBeGreaterThan(milestoneScene(5));
    // Continuous input moves freely across card positions instead of completing a trip to each one.
    expect(page.visited).not.toContain(milestoneScene(3));
    const released = page.position();
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - released) < Math.abs(best - released) ? stop : best);
    page.run(1800);
    expect(page.position()).toBeCloseTo(nearest);
    page.run(5000);
    expect(page.position()).toBeCloseTo(nearest);
  });

  it("keeps moving for steady gentler scrolling after a strong initial flick", () => {
    const page = harness(false, milestoneScene(2));
    page.wheel(160);
    for (let i = 0; i < 36; i++) {
      page.run(30);
      page.wheel(40);
    }
    expect(page.position()).toBeGreaterThan(milestoneScene(4));
    const released = page.position();
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - released) < Math.abs(best - released) ? stop : best);
    page.run(2000);
    expect(page.position()).toBeCloseTo(nearest);
  });

  it("responds immediately to reverse input during continuous scrolling", () => {
    const page = harness(false, milestoneScene(5));
    page.wheel(60);
    for (let i = 0; i < 18; i++) {
      page.run(30);
      page.wheel(60);
    }
    const beforeReverse = page.position();
    page.wheel(-80);
    expect(page.position()).toBeLessThan(beforeReverse);
    for (let i = 0; i < 8; i++) {
      page.run(30);
      page.wheel(-60);
    }
    const released = page.position();
    expect(released).toBeLessThan(beforeReverse);
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - released) < Math.abs(best - released) ? stop : best);
    page.run(2000);
    expect(page.position()).toBeCloseTo(nearest);
  });

  it("returns to a single next-item trip for a fresh gesture after continuous scrolling settles", () => {
    const page = harness(false, milestoneScene(2));
    page.wheel(60);
    for (let i = 0; i < 18; i++) {
      page.run(30);
      page.wheel(60);
    }
    page.run(2000);
    const resting = page.position();
    const next = STORY_STOPS.find(stop => stop > resting + 0.001);
    page.wheel(40);
    page.run(2000);
    expect(page.position()).toBeCloseTo(next!);
  });

  it("finishes a staircase step promptly and accepts the next gesture immediately on arrival", () => {
    const page = harness(false, milestoneScene(2), 1000 / 14);
    page.wheel(80);
    page.run(700);
    expect(page.position()).toBeCloseTo(milestoneScene(3));
    expect(Math.abs(page.visiblePosition() - page.position())).toBeLessThan(0.003);
    // No extra 220ms hold, and no discarded follow-up gesture after arriving.
    page.wheel(80);
    page.run(100);
    expect(page.position()).toBeGreaterThan(milestoneScene(3));
    page.run(460);
    expect(page.position()).toBeCloseTo(milestoneScene(4));
    expect(page.visited).toContain(milestoneScene(3));
  });

  it("lets a new swipe depart immediately after the previous staircase step", () => {
    const page = harness(false, milestoneScene(2));
    page.touch("touchstart", 100, 600);
    page.touch("touchmove", 100, 570);
    page.touch("touchend", 100, 570, 0);
    page.run(700);
    expect(page.position()).toBeCloseTo(milestoneScene(3));
    page.touch("touchstart", 100, 600);
    page.touch("touchmove", 100, 570);
    page.touch("touchend", 100, 570, 0);
    page.run(560);
    expect(page.position()).toBeCloseTo(milestoneScene(4));
  });

  it("can reverse an unfinished trip immediately without adding a queued forward stop", () => {
    const page = harness(false, STORY_STOPS[2]);
    page.wheel(80);
    page.run(500);
    const beforeReverse = page.position();
    page.wheel(-80);
    page.run(2000);
    expect(page.position()).toBeLessThan(beforeReverse);
    expect(page.position()).toBeCloseTo(STORY_STOPS[2]);
    page.run(3000);
    expect(page.position()).toBeCloseTo(STORY_STOPS[2]);
  });

  it("lets continued input move past stops even while the camera is catching up", () => {
    const page = harness(false, milestoneScene(2), 1100);
    page.wheel(80);
    for (let i = 0; i < 25; i++) {
      page.run(30);
      page.wheel(80);
    }
    expect(page.position()).toBeGreaterThan(milestoneScene(4));
    expect(page.visiblePosition()).toBeLessThan(page.position());
    page.run(2000);
    expect(STORY_STOPS.some(stop => Math.abs(stop - page.position()) < 0.0001)).toBe(true);
  });

  it("ignores a single long momentum tail without skipping the destination", () => {
    const page = harness();
    for (let i = 0; i < 150; i++) {
      page.wheel(120 * 0.975 ** i);
      page.run(16);
    }
    page.run(2000);
    expect(page.position()).toBeCloseTo(STORY_STOPS[1]);
  });

  it("ends with two complete statements instead of stopping halfway through the first sentence", () => {
    expect(STORY_STOPS.slice(-2)).toEqual(CLOSING_STOPS);
    const page = harness(false, stopScene(STOP_COUNT - 1));
    page.wheel(80);
    page.run(2000);
    expect(page.position()).toBeCloseTo(CLOSING_STOPS[0]);
    page.wheel(80);
    page.run(2000);
    expect(page.position()).toBeCloseTo(CLOSING_STOPS[1]);
    page.wheel(-80);
    page.run(2000);
    expect(page.position()).toBeCloseTo(CLOSING_STOPS[0]);
  });

  it("offers instant keyboard stops and leaves button activation and text editing native", () => {
    const page = harness();
    expect(page.key("PageDown").defaultPrevented).toBe(true);
    expect(page.position()).toBe(STORY_STOPS[1]);
    page.key("ArrowDown");
    expect(page.position()).toBe(STORY_STOPS[2]);
    page.key(" ", page.root, { shiftKey: true });
    expect(page.position()).toBe(STORY_STOPS[1]);
    page.key("End");
    expect(page.position()).toBe(LAST_SCENE + 1);
    page.key("Home");
    expect(page.position()).toBe(0);
    for (const tag of ["button", "a", "input", "textarea", "select"]) {
      const control = document.createElement(tag);
      page.root.append(control);
      expect(page.key(" ", control).defaultPrevented).toBe(false);
    }
    expect(page.position()).toBe(0);
  });

  it("settles reduced-motion scrolling immediately and respects page boundaries", () => {
    const page = harness(true);
    page.wheel(-100);
    expect(page.position()).toBe(0);
    page.run(250);
    page.wheel(100);
    expect(page.position()).toBe(STORY_STOPS[1]);
    page.key("End");
    page.run(250);
    page.wheel(100);
    expect(page.position()).toBe(LAST_SCENE + 1);
  });

  it("moves directly in reduced-motion flow and settles without an animated snap", () => {
    const page = harness(true, milestoneScene(2));
    page.wheel(80);
    for (let i = 0; i < 20; i++) {
      page.run(30);
      page.wheel(70);
    }
    expect(page.position()).toBeGreaterThan(milestoneScene(4));
    expect(page.visited.some(position => !STORY_STOPS.some(stop => Math.abs(stop - position) < 0.0001))).toBe(true);
    const released = page.position();
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - released) < Math.abs(best - released) ? stop : best);
    const beforeIdle = page.visited.length;
    page.run(1000);
    expect(page.position()).toBeCloseTo(nearest);
    expect(page.visited.slice(beforeIdle).every(stop => stop === nearest)).toBe(true);
  });

  it.each(["external scroll", "cancel", "resize", "hashchange", "pinch", "dispose"])("cancels continuous scrolling and its idle snap on %s", action => {
    const page = harness(false, milestoneScene(2));
    page.wheel(80);
    for (let i = 0; i < 18; i++) {
      page.run(30);
      page.wheel(80);
    }
    if (action === "external scroll") page.externalScroll(2.165);
    else if (action === "cancel") page.guide.cancel();
    else if (action === "resize" || action === "hashchange") window.dispatchEvent(new Event(action));
    else if (action === "pinch") expect(page.wheel(80, { ctrlKey: true }).defaultPrevented).toBe(false);
    else page.guide.dispose();
    const resting = page.position();
    page.run(3000);
    expect(page.position()).toBe(resting);
  });

  it("leaves pinch zoom, horizontal gestures, form fields, and nested scrolling alone", () => {
    const page = harness();
    expect(page.wheel(80, { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(page.wheel(80, { deltaX: 120 }).defaultPrevented).toBe(false);
    const input = document.createElement("input");
    page.root.append(input);
    expect(page.wheel(80, {}, input).defaultPrevented).toBe(false);
    const scroller = document.createElement("div");
    scroller.style.overflowY = "auto";
    Object.defineProperty(scroller, "scrollHeight", { value: 500 });
    Object.defineProperty(scroller, "clientHeight", { value: 100 });
    page.root.append(scroller);
    expect(page.wheel(80, {}, scroller).defaultPrevented).toBe(false);
    page.run(2000);
    expect(page.position()).toBe(0);
  });

  it("keeps short swipes to one item and lets a long drag flow past breakpoints until release", () => {
    const page = harness(false, milestoneScene(2));
    page.touch("touchstart", 100, 900);
    expect(page.touch("touchmove", 101, 885).defaultPrevented).toBe(true);
    page.touch("touchend", 101, 885, 0);
    page.run(2000);
    expect(page.position()).toBeCloseTo(milestoneScene(3));
    page.touch("touchstart", 100, 900);
    page.touch("touchmove", 100, 880);
    page.run(100);
    page.touch("touchmove", 100, 700);
    page.run(100);
    page.touch("touchmove", 100, 100);
    expect(page.position()).toBeGreaterThan(milestoneScene(4));
    const released = page.position();
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - released) < Math.abs(best - released) ? stop : best);
    // A stationary finger does not trigger the wheel's idle snap.
    page.run(1000);
    expect(page.position()).toBe(released);
    page.touch("touchend", 100, 100, 0);
    page.run(2000);
    expect(page.position()).toBeCloseTo(nearest);
    page.touch("touchstart", 100, 600);
    expect(page.touch("touchmove", 200, 590).defaultPrevented).toBe(false);
  });

  it.each(["touchcancel", "pinch"])("releases a long touch drag without snapping when interrupted by %s", action => {
    const page = harness(false, milestoneScene(2));
    page.touch("touchstart", 100, 900);
    page.touch("touchmove", 100, 880);
    page.run(100);
    page.touch("touchmove", 100, 680);
    const interrupted = page.position();
    if (action === "pinch") page.touch("touchmove", 100, 500, 2);
    else page.touch("touchcancel", 100, 680, 0);
    page.touch("touchend", 100, 680, 0);
    page.run(2000);
    expect(page.position()).toBe(interrupted);
  });

  it("claims a slow vertical swipe before native scrolling starts, without advancing on tiny movements", () => {
    const page = harness();
    page.touch("touchstart", 100, 600);
    expect(page.touch("touchmove", 100, 598).defaultPrevented).toBe(true);
    page.run(100);
    expect(page.touch("touchmove", 100, 595).defaultPrevented).toBe(true);
    page.run(200);
    expect(page.position()).toBe(0);
    expect(page.touch("touchmove", 100, 587).defaultPrevented).toBe(true);
    page.touch("touchend", 100, 587, 0);
    page.run(2000);
    expect(page.position()).toBeCloseTo(STORY_STOPS[1]);
  });

  it("does not fight a touch or wheel scroll the browser has already claimed", () => {
    const page = harness();
    page.touch("touchstart", 100, 600);
    page.touch("touchmove", 100, 580);
    page.run(250);
    const touchPosition = page.position();
    expect(page.touch("touchmove", 100, 450, 1, false).defaultPrevented).toBe(false);
    page.run(1200);
    expect(page.position()).toBe(touchPosition);
    page.wheel(80);
    page.run(250);
    const wheelPosition = page.position();
    expect(page.wheel(80, { cancelable: false }).defaultPrevented).toBe(false);
    page.run(1200);
    expect(page.position()).toBe(wheelPosition);
  });

  it("lets external scrolling take control and removes every handler on disposal", () => {
    const page = harness();
    page.wheel(80);
    page.run(300);
    page.externalScroll(2.165);
    page.run(1200);
    expect(page.position()).toBe(2.165);
    page.wheel(80);
    page.run(2000);
    expect(page.position()).toBeCloseTo(stopScene(0));
    page.guide.dispose();
    expect(page.wheel(80).defaultPrevented).toBe(false);
    expect(page.key("End").defaultPrevented).toBe(false);
    page.run(2000);
    expect(page.position()).toBeCloseTo(stopScene(0));
  });
});

describe("wheel intent", () => {
  it("normalizes a quiet new gesture and responds immediately to a direction change", () => {
    const intent = createWheelIntent();
    expect(intent.push(2, 0)).toBeNull();
    expect(intent.push(4, 16)).toBe(1);
    expect(intent.push(3, 32)).toBeNull();
    expect(intent.push(-6, 48)).toBe(-1);
    expect(intent.push(6, 400)).toBe(1);
    intent.reset();
    expect(intent.push(6, 410)).toBe(1);
  });
});
