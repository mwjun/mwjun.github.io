export const SCULPTURE_SHAPES = ["Sphere", "Crystal", "Wave", "Helix", "Ribbon", "Donut"] as const;

// Story scroll progress for the two moves: donut to helix (right to left), then helix to sphere (left to right).
export const HELIX_MORPH = { start: 0.06, end: 0.38 } as const;
export const SPHERE_MORPH = { start: 0.46, end: 0.8 } as const;
