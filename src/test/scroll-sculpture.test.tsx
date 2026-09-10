import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render } from "@testing-library/react";
import { motionValue } from "framer-motion";
import ScrollSculpture from "@/components/ScrollSculpture";
import JourneyHelix from "@/components/JourneyHelix";
import type { MotionValue } from "framer-motion";

// Verify the scene's scheduling contract without requiring a GPU or real browser.
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0;
let setVisible: (entries: Partial<IntersectionObserverEntry>[]) => void;
const clear = vi.fn();
const context = {
  clearRect: clear, createRadialGradient: () => ({ addColorStop: vi.fn() }),
  fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
  stroke: vi.fn(), arc: vi.fn(), fill: vi.fn(), setTransform: vi.fn(),
};
function flushFrames(limit = 120) {
  let count = 0;
  while (frames.size && count++ < limit) {
    const pending = [...frames.entries()]; frames.clear();
    pending.forEach(([, callback]) => callback(count * 16));
  }
  expect(frames.size).toBe(0);
}

beforeEach(() => {
  frames.clear(); nextFrame = 0; vi.clearAllMocks();
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id));
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('IntersectionObserver', class { constructor(callback: typeof setVisible) { setVisible = callback; } observe() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 1200, height: 800 } as DOMRect);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const scenes = [
  { name: 'homepage sculpture', end: 1, Scene: ({ progress, paused }: { progress: MotionValue<number>; paused: boolean }) => <ScrollSculpture progress={progress} paused={paused} /> },
  { name: 'career helix', end: 12, Scene: ({ progress, paused }: { progress: MotionValue<number>; paused: boolean }) => <JourneyHelix position={progress} count={13} paused={paused} /> },
];

describe.each(scenes)('$name', ({ Scene, end }) => {
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
