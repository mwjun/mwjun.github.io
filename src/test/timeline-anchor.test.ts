import { describe, expect, it } from "vitest";
import { getTimelineAnchor } from "@/lib/timeline-anchor";

describe('timeline connector anchors', () => {
  const canvas = { left: 40, top: 0, width: 1200, height: 800 };
  const card = { left: 820, top: 300, width: 360, height: 200 };

  it('follows the actual card center during entry, reading, and exit', () => {
    expect(getTimelineAnchor(canvas, { ...card, top: 560 }, 800)).toEqual({ x: 780, y: 660 });
    expect(getTimelineAnchor(canvas, card, 800)).toEqual({ x: 780, y: 400 });
    expect(getTimelineAnchor(canvas, { ...card, top: 40 }, 800)).toEqual({ x: 780, y: 140 });
  });

  it('accounts for the canvas moving before sticking and after release', () => {
    expect(getTimelineAnchor({ ...canvas, top: 150 }, card, 800)).toEqual({ x: 780, y: 250 });
    expect(getTimelineAnchor({ ...canvas, top: -120 }, card, 800)).toEqual({ x: 780, y: 520 });
  });

  it('uses the resized card geometry', () => {
    expect(getTimelineAnchor(canvas, { ...card, left: 720, height: 360 }, 800)).toEqual({ x: 680, y: 480 });
  });

  it('omits offscreen midpoints instead of drawing misleading clamped lines', () => {
    expect(getTimelineAnchor(canvas, { ...card, top: -210 }, 800)).toBeNull();
    expect(getTimelineAnchor(canvas, { ...card, top: 740 }, 800)).toBeNull();
    expect(getTimelineAnchor({ ...canvas, top: -500 }, card, 800)).toBeNull();
  });
});
