import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HeroSection from "@/components/HeroSection";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const renderStory = () => render(<MemoryRouter><HeroSection /></MemoryRouter>);
const isSkipped = (view: ReturnType<typeof renderStory>) => view.container.querySelector("#story")?.classList.contains("is-intro-skipped");

describe("story intro", () => {
  it("replays if left early, then is skipped when returning to Story after it finishes", () => {
    const early = renderStory();
    expect(isSkipped(early)).toBe(false);
    expect(early.container.querySelector('[role="group"][aria-label^="Preview"], .shape-preview-button')).toBeNull();
    act(() => { vi.advanceTimersByTime(1000); });
    early.unmount();

    const full = renderStory();
    expect(isSkipped(full)).toBe(false);
    act(() => { vi.advanceTimersByTime(4000); });
    full.unmount();

    const returning = renderStory();
    expect(isSkipped(returning)).toBe(true);
    expect(returning.container.querySelector(".intro-copy")).toHaveAttribute("aria-hidden", "false");
  });
});
