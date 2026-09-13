import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { motionValue } from "framer-motion";
import ScrollSculpture from "@/components/ScrollSculpture";
import JourneyHelix from "@/components/JourneyHelix";
import JourneyParticles from "@/components/JourneyParticles";
import type { MotionValue } from "framer-motion";

// Verify the scene's scheduling contract without requiring a GPU or real browser.
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let frameTime = 0;
let canvasTop = 0;
let storyBottom = window.innerHeight;
let setVisible: (entries: Partial<IntersectionObserverEntry>[]) => void;
const clear = vi.fn();
const context = {
  clearRect: clear, createRadialGradient: () => ({ addColorStop: vi.fn() }),
  fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
  stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), setTransform: vi.fn(),
  save: vi.fn(), restore: vi.fn(), globalCompositeOperation: "source-over",
};
function stepFrames(limit = 1) {
  let count = 0;
  while (frames.size && count++ < limit) {
    frameTime += 1000 / 60;
    const pending = [...frames.values()]; frames.clear();
    pending.forEach(callback => callback(frameTime));
  }
}
function flushFrames(limit = 120) {
  let count = 0;
  while (frames.size && count++ < limit) {
    stepFrames();
  }
  expect(frames.size).toBe(0);
}

beforeEach(() => {
  frames.clear(); nextFrame = 0; frameTime = 0; canvasTop = 0; storyBottom = window.innerHeight; vi.clearAllMocks();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof setVisible) { setVisible = callback; } observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1200);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
    if (this.classList.contains('cinematic-story')) {
      return { left: 0, top: storyBottom - 3200, bottom: storyBottom, width: 1200, height: 3200 } as DOMRect;
    }
    return { left: 0, top: 0, width: 0, height: 0 } as DOMRect;
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({ left: 0, top: canvasTop, width: 1200, height: 800 } as DOMRect));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

let introProgress: MotionValue<number>;

const scenes = [
  { name: 'homepage sculpture', end: 1, Scene: ({ progress, paused }: { progress: MotionValue<number>; paused: boolean }) => <ScrollSculpture progress={progress} introProgress={introProgress} paused={paused} /> },
  { name: 'career helix', end: 12, Scene: ({ progress, paused }: { progress: MotionValue<number>; paused: boolean }) => <JourneyHelix position={progress} count={13} paused={paused} /> },
];

describe.each(scenes)('$name', ({ Scene, end }) => {
  beforeEach(() => {
    introProgress = motionValue(1);
  });

  it('settles at rest, scrubs in both directions, and cancels pending frames on unmount', () => {
    const progress = motionValue(0);
    const { unmount } = render(<Scene progress={progress} paused={false} />);
    flushFrames(); expect(clear).toHaveBeenCalledTimes(1);
    act(() => progress.set(end)); flushFrames();
    const forwardFrames = clear.mock.calls.length; expect(forwardFrames).toBeGreaterThan(1);
    act(() => progress.set(0)); flushFrames(); expect(clear.mock.calls.length).toBeGreaterThan(forwardFrames);
    act(() => progress.set(0.5)); expect(frames.size).toBe(1);
    unmount(); expect(frames.size).toBe(0);
    act(() => progress.set(0.6)); expect(frames.size).toBe(0);
  });
  it('does not animate while paused and resumes from the current frame', () => {
    const progress = motionValue(0);
    const view = render(<Scene progress={progress} paused />);
    flushFrames();
    act(() => progress.set(end)); flushFrames();
    expect(clear).toHaveBeenCalledTimes(1);
    view.rerender(<Scene progress={progress} paused={false} />);
    flushFrames(); expect(clear.mock.calls.length).toBeGreaterThan(3);
  });
  it('suspends work when the scene is offscreen', () => {
    const progress = motionValue(0);
    render(<Scene progress={progress} paused={false} />); flushFrames();
    setVisible([{ isIntersecting: false }]);
    act(() => progress.set(end)); expect(frames.size).toBe(0);
    setVisible([{ isIntersecting: true }]); flushFrames();
    expect(clear.mock.calls.length).toBeGreaterThan(1);
  });
});

describe('journey ambient particles', () => {
  it('runs independently from the helix frame loop and preserves pause state', () => {
    const view = render(<JourneyParticles paused={false} />);
    const layer = view.container.querySelector('.journey-particles');
    const particles = view.container.querySelectorAll('.journey-particle');
    const firstParticle = particles[0];
    const duration = (firstParticle as HTMLElement).style.getPropertyValue('--particle-duration');

    expect(layer).not.toHaveClass('is-paused');
    expect(particles).toHaveLength(24);
    expect(duration).toMatch(/s$/);
    expect(frames.size).toBe(0);

    view.rerender(<JourneyParticles paused />);
    expect(layer).toHaveClass('is-paused');
    expect(view.container.querySelector('.journey-particle')).toBe(firstParticle);
    expect((firstParticle as HTMLElement).style.getPropertyValue('--particle-duration')).toBe(duration);
    expect(frames.size).toBe(0);

    view.rerender(<JourneyParticles paused={false} />);
    expect(layer).not.toHaveClass('is-paused');
    expect(view.container.querySelector('.journey-particle')).toBe(firstParticle);
    expect(frames.size).toBe(0);
  });
});

describe('homepage sphere scroll', () => {
  it('keeps rotating through the final scroll-out distance and stops at rest', () => {
    const progress = motionValue(1);
    const intro = motionValue(1);
    const { unmount } = render(<section className="cinematic-story"><ScrollSculpture progress={progress} introProgress={intro} paused={false} /></section>);
    flushFrames();
    const beforePoint = [...context.lineTo.mock.calls[0]];
    context.lineTo.mockClear();
    clear.mockClear();

    storyBottom = window.innerHeight * 0.5;
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(frames.size).toBe(1);
    stepFrames();
    expect(context.lineTo.mock.calls[0]).not.toEqual(beforePoint);
    const halfwayPoint = [...context.lineTo.mock.calls[0]];
    flushFrames();

    context.lineTo.mockClear();
    storyBottom = window.innerHeight * 0.25;
    act(() => window.dispatchEvent(new Event('scroll')));
    stepFrames();
    expect(context.lineTo.mock.calls[0]).not.toEqual(halfwayPoint);
    flushFrames();
    const settledPaints = clear.mock.calls.length;
    stepFrames(4);
    expect(clear).toHaveBeenCalledTimes(settledPaints);

    unmount();
    storyBottom = window.innerHeight * 0.25;
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(frames.size).toBe(0);
  });

  it('freezes the exit rotation while motion is paused', () => {
    const progress = motionValue(1);
    const intro = motionValue(1);
    render(<ScrollSculpture progress={progress} introProgress={intro} paused />);
    flushFrames();
    clear.mockClear();
    canvasTop = -400;
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(frames.size).toBe(0);
    expect(clear).not.toHaveBeenCalled();
  });
});

describe('career connectors', () => {
  it('follows native scrolling when progress is clamped or the helix is paused', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 20, top: 60, width: 1200, height: 800 } as DOMRect);
    const card = document.createElement('article');
    let cardTop = 300;
    vi.spyOn(card, 'getBoundingClientRect').mockImplementation(() => ({ left: 860, top: cardTop, width: 300, height: 180 }) as DOMRect);
    const position = motionValue(0);
    const { unmount } = render(<JourneyHelix position={position} count={1} paused cards={{ current: [card] }} />);
    flushFrames();
    expect(context.lineTo).toHaveBeenCalledWith(840, 330);
    context.lineTo.mockClear();
    cardTop = 160;
    act(() => window.dispatchEvent(new Event('scroll')));
    flushFrames();
    expect(context.lineTo).toHaveBeenCalledWith(840, 190);
    expect(position.get()).toBe(0);
    unmount();
    act(() => window.dispatchEvent(new Event('scroll')));
    expect(frames.size).toBe(0);
  });
});
