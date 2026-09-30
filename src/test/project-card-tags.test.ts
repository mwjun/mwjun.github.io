import { afterEach, expect, it, vi } from "vitest";
import { projects } from "@/data/projects";
import { paintProject } from "@/lab/cards";

afterEach(() => vi.restoreAllMocks());

it("renders every project tag in wrapped rows without overlapping its title or header", () => {
  let font = "21px monospace";
  const text: { value: string; x: number; y: number; size: number }[] = [];
  const context = new Proxy({}, {
    get: (_, key) => {
      if (key === "font") return font;
      if (key === "measureText") return (value: string) => ({ width: value.length * 12.6 });
      if (key === "fillText") return (value: string, x: number, y: number) => text.push({ value, x, y, size: Number(font.match(/(\d+)px/)?.[1]) });
      if (key === "createLinearGradient") return () => ({ addColorStop: () => {} });
      return () => {};
    },
    set: (_, key, value) => { if (key === "font") font = value; return true; },
  });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as CanvasRenderingContext2D);
  projects.forEach((project, index) => {
    text.length = 0;
    paintProject(project, index);
    const tags = text.filter(item => item.size === 21);
    const titles = text.filter(item => item.size === 76);
    for (const tag of project.tags) expect(tags.map(item => item.value).join(" ")).toContain(tag.toUpperCase());
    expect(Math.min(...titles.map(item => item.y)) - 76).toBeGreaterThan(94);
    expect(Math.max(...titles.map(item => item.y))).toBeLessThan(tags[0].y - 21);
    for (const row of tags) {
      expect(row.x + row.value.length * 12.6).toBeLessThanOrEqual(960);
      expect(row.y).toBeLessThanOrEqual(576);
    }
  });
});
