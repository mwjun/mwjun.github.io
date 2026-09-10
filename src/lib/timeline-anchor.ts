type Bounds = { left: number; top: number; width: number; height: number };

/** Keep DOM-to-canvas coordinates in CSS pixels; the context handles DPR. */
export function getTimelineAnchor(canvas: Bounds, card: Bounds, viewportHeight: number) {
  const centerY = card.top + card.height / 2;
  const x = card.left - canvas.left;
  const visibleTop = Math.max(0, canvas.top);
  const visibleBottom = Math.min(viewportHeight, canvas.top + canvas.height);
  if (card.height <= 0 || x <= 0 || x >= canvas.width || centerY < visibleTop || centerY > visibleBottom) return null;
  return { x, y: centerY - canvas.top };
}
