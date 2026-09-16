import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { GRID_BOTTOM, GRID_TOP, SKILLS, layoutGrid, rankSkills } from "@/lab/skillSearch";

vi.mock("@/lab/skillSphere", () => ({ createSkillSphere: () => null }));
const { default: TestSkills } = await import("@/pages/TestSkills");

afterEach(cleanup);

describe("v4 skill search", () => {
  it("ranks exact and prefix matches first and ignores case and surrounding space", () => {
    expect(rankSkills("  PYTORCH  ", null).map(entry => entry.skill)).toEqual(["PyTorch"]);
    const aws = rankSkills("aws", null).map(entry => entry.skill);
    expect(aws[0]).toBe("AWS");
    expect(aws).toEqual(expect.arrayContaining(["AWS EC2", "AWS IAM", "AWS Lightsail"]));
    expect(rankSkills("react", null)[0].skill).toBe("React");
    expect(rankSkills("", null)).toEqual([]);
  });

  it("filters by discipline, alone or combined with a query", () => {
    expect(rankSkills("", "Security")).toHaveLength(17);
    expect(rankSkills("sql", "Security").map(entry => entry.skill)).toEqual(["SQL Injection Prevention"]);
    expect(rankSkills("security", null).length).toBeGreaterThanOrEqual(17);
  });

  it("lays results out in rows between the header and the search bar, with columns wide enough for the longest name", () => {
    const longestSkill = Math.max(...SKILLS.map(entry => entry.skill.length));
    for (const [width, height, compact] of [[1440, 900, false], [390, 844, true]] as const) {
      for (const count of [1, 5, 17, SKILLS.length]) {
        for (const longest of [4, 14, longestSkill]) {
          const { positions, shown, cellWidth } = layoutGrid(count, width, height, compact, longest);
          expect(shown).toBeGreaterThan(0);
          expect(shown).toBeLessThanOrEqual(count);
          expect(positions).toHaveLength(shown);
          for (const [x, y] of positions) {
            expect(x).toBeGreaterThanOrEqual(0);
            expect(x + cellWidth - 16).toBeLessThanOrEqual(width);
            expect(y).toBeGreaterThanOrEqual(compact ? GRID_TOP.compact : GRID_TOP.wide);
            expect(y).toBeLessThanOrEqual(height - (compact ? GRID_BOTTOM.compact : GRID_BOTTOM.wide));
          }
          // Neighbors in a row are a full column apart, so labels can't collide.
          positions.forEach(([x, y], i) => {
            const next = positions[i + 1];
            if (next && next[1] === y) expect(next[0] - x).toBeGreaterThanOrEqual(cellWidth - 0.001);
          });
          if (!compact) expect(cellWidth).toBeGreaterThanOrEqual(Math.min(longest * 8 + 36, 1120));
        }
      }
    }
    expect(layoutGrid(5, 1440, 900, false).shown).toBe(5);
  });
});

describe("v4 skills page without WebGL", () => {
  it("lists every skill, narrows as you search or pick a discipline, and links back to the story", () => {
    render(<MemoryRouter><TestSkills /></MemoryRouter>);
    const list = screen.getByRole("list", { name: "Matching skills" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(SKILLS.length);
    expect(screen.getByRole("status")).toHaveTextContent(`${SKILLS.length} skills`);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search skills" }), { target: { value: "python" } });
    expect(within(list).getAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("1 skill");

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    fireEvent.click(screen.getByRole("button", { name: "Security" }));
    expect(screen.getByRole("button", { name: "Security" })).toHaveAttribute("aria-pressed", "true");
    expect(within(list).getAllByRole("listitem")).toHaveLength(17);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Security" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("link", { name: /Back to the story/ })).toHaveAttribute("href", "/");
  });
});
