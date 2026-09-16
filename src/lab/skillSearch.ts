import { skillGroups } from "@/data/skills";

// Search and layout for the v4 skills sphere. Kept free of rendering so it can be tested on its own.

export type SkillEntry = { skill: string; category: string; groupIndex: number; index: number };

export const SKILLS: SkillEntry[] = skillGroups.flatMap((group, groupIndex) => group.skills.map(skill => ({ skill, category: group.category, groupIndex }))).map((entry, index) => ({ ...entry, index }));
export const CATEGORIES = skillGroups.map(group => group.category);
// The atom's palette, one color per discipline.
export const CATEGORY_COLORS = ["#b9e9e6", "#c0b8ef", "#a5c9ef", "#e4c4aa", "#9cd9bc", "#d5b6d6"];

const score = (entry: SkillEntry, query: string) => {
  const name = entry.skill.toLowerCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.split(/[\s/.&()-]+/).some(word => word.startsWith(query))) return 2;
  if (name.includes(query)) return 3;
  if (entry.category.toLowerCase().includes(query)) return 4;
  return -1;
};

// Best matches first: exact, then prefix, then word prefix, then anywhere in the name, then discipline name.
export function rankSkills(query: string, category: string | null): SkillEntry[] {
  const normalized = query.trim().toLowerCase();
  const pool = category ? SKILLS.filter(entry => entry.category === category) : SKILLS;
  if (!normalized) return category ? pool : [];
  return pool
    .map(entry => ({ entry, rank: score(entry, normalized) }))
    .filter(item => item.rank >= 0)
    .sort((a, b) => a.rank - b.rank || a.entry.skill.length - b.entry.skill.length || a.entry.skill.localeCompare(b.entry.skill))
    .map(item => item.entry);
}

export type GridLayout = { positions: [number, number][]; shown: number; cellWidth: number };

export const GRID_TOP = { wide: 150, compact: 200 } as const;
export const GRID_BOTTOM = { wide: 230, compact: 250 } as const;

// Lays results out in centered rows between the header and the search bar. Positions are the dot's screen point in
// pixels; its label sits to the right. Columns are as wide as the longest name needs (`longest`, in characters), so
// labels never run into each other. Results that don't fit stay lit on the sphere instead.
export function layoutGrid(count: number, width: number, height: number, compact: boolean, longest = 14): GridLayout {
  const top = compact ? GRID_TOP.compact : GRID_TOP.wide;
  const bottom = height - (compact ? GRID_BOTTOM.compact : GRID_BOTTOM.wide);
  const regionWidth = Math.min(width - 32, compact ? width : 1120);
  const characterWidth = compact ? 6.8 : 8;
  const cellWidth = Math.min(regionWidth, Math.max(compact ? 120 : 170, longest * characterWidth + 36));
  const rowHeight = compact ? 34 : 40;
  const columns = Math.max(1, Math.min(count, Math.floor(regionWidth / cellWidth)));
  const maxRows = Math.max(1, Math.floor((bottom - top) / rowHeight));
  const shown = Math.min(count, columns * maxRows);
  const rows = Math.ceil(shown / columns);
  const firstRow = (top + bottom) / 2 - ((rows - 1) * rowHeight) / 2;
  const positions: [number, number][] = [];
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / columns);
    const inRow = row === rows - 1 ? shown - row * columns : columns;
    const column = i - row * columns;
    // The dot starts the cell and the label fills the rest, so shift left to center the dot and label together.
    const x = width / 2 + (column - (inRow - 1) / 2) * cellWidth - cellWidth / 2 + 16;
    positions.push([x, firstRow + row * rowHeight]);
  }
  return { positions, shown, cellWidth };
}
