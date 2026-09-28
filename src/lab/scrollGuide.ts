import { CLOSING_STOPS, MILESTONE_COUNT, NAV_ANCHORS, STOP_COUNT, milestoneScene, stopScene } from "./timeline";

// Stops are the settled views, not section edges where cards are still fading in.
export const STORY_STOPS = [
  0,
  NAV_ANCHORS.about.section + NAV_ANCHORS.about.at,
  ...Array.from({ length: MILESTONE_COUNT }, (_, i) => milestoneScene(i)),
  NAV_ANCHORS.work.section + NAV_ANCHORS.work.at,
  ...Array.from({ length: STOP_COUNT }, (_, i) => stopScene(i)),
  ...CLOSING_STOPS,
];

type Direction = -1 | 1;

// A trackpad gesture includes a long decaying momentum tail. Only renewed input should switch a short trip
// into free scrolling; the tail of a single flick should still land on its original destination.
export function createWheelIntent() {
  let lastTime = -Infinity;
  let direction = 0;
  let recent: { magnitude: number; time: number }[] = [];
  let distance = 0;
  let advancedAt = -Infinity;
  let started = false;
  const reset = () => {
    lastTime = -Infinity;
    started = false;
    distance = direction = 0;
    recent = [];
  };
  return {
    reset,
    push(delta: number, now: number): Direction | null {
      const nextDirection = Math.sign(delta);
      if (!nextDirection) return null;
      if (now - lastTime > 200 || nextDirection !== direction) {
        started = false;
        distance = 0;
        recent = [];
      }
      lastTime = now;
      direction = nextDirection;
      const magnitude = Math.abs(delta);
      recent = recent.filter(sample => now - sample.time <= 240);
      recent.push({ magnitude, time: now });
      const recentPeak = Math.max(...recent.map(sample => sample.magnitude));
      distance += magnitude;
      if (!started && distance >= 5) {
        started = true;
        advancedAt = now;
        distance = 0;
        return direction as Direction;
      }
      // Compare with recent input, not the gesture's initial peak. Steady gentler input still works, while a
      // progressively shrinking momentum tail cannot count as renewed effort.
      if (started && now - advancedAt >= 240 && distance >= 120 && magnitude >= Math.max(8, recentPeak * 0.97)) {
        advancedAt = now;
        distance = 0;
        return direction as Direction;
      }
      return null;
    },
  };
}

type GuideOptions = {
  root: HTMLElement;
  scene: () => number;
  scrollToScene: (s: number) => void;
  renderedScene?: () => number;
  reducedMotion: boolean;
};

const editable = (target: Element | null) => !!target?.closest("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='slider'], [role='spinbutton'], [data-native-scroll]");
const control = (target: Element | null) => editable(target) || !!target?.closest("button, a, summary, [role='button'], [role='tab'], [role='menuitem'], [role='combobox'], [role='listbox'], [role='tree'], [role='grid'], [role='menu']");
const targetElement = (target: EventTarget | null) => target instanceof Element ? target : null;

// Leave native scrolling to menus, dialogs and any independently scrollable content, even at their boundaries.
function nestedScroller(target: Element | null, root: HTMLElement) {
  for (let node = target; node && node !== root && node !== document.body; node = node.parentElement) {
    if (node.scrollHeight > node.clientHeight + 1 && /auto|scroll|overlay/.test(getComputedStyle(node).overflowY)) return true;
    if (node.matches("[role='dialog'], dialog")) return true;
  }
  return false;
}

export function createScrollGuide(options: GuideOptions) {
  const { root, scene, scrollToScene, reducedMotion } = options;
  const renderedScene = options.renderedScene ?? scene;
  const wheel = createWheelIntent();
  let frame = 0;
  let motion: { from: number; to: number; start: number; duration: number; settling: boolean } | null = null;
  let writtenScene = scene();
  let arrived: { target: number; at: number; direction: number } | null = null;
  let continuous = false;
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let lastIntent: { at: number; direction: Direction } | null = null;
  let disposed = false;
  let touch: { x: number; y: number; anchorY: number; started: boolean; ignored: boolean } | null = null;

  const clearIdle = () => {
    clearTimeout(idleTimer);
    idleTimer = undefined;
  };

  const stopMotion = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    motion = null;
  };
  const cancel = () => {
    stopMotion();
    clearIdle();
    continuous = false;
    lastIntent = null;
    arrived = null;
    wheel.reset();
    touch = null;
  };
  const write = (s: number) => {
    scrollToScene(s);
    // Read back the clamped scroll position, which can differ slightly due to pixel rounding or a resize.
    writtenScene = scene();
  };
  const tick = (now: number) => {
    if (!motion || disposed) return;
    const t = Math.min(1, Math.max(0, (now - motion.start) / motion.duration));
    const eased = t * t * (3 - 2 * t);
    write(motion.from + (motion.to - motion.from) * eased);
    if (t < 1) frame = requestAnimationFrame(tick);
    else {
      arrived = { target: motion.to, at: now, direction: Math.sign(motion.to - motion.from) };
      frame = 0;
      motion = null;
    }
  };
  const goTo = (target: number, instant = false, continuing = false, settling = false) => {
    stopMotion();
    if (reducedMotion || instant) {
      write(target);
      return;
    }
    const from = scene();
    // Keep the larger section handoffs smooth, with brisk trips between individual cards.
    const baseDuration = Math.abs(target - from) > 0.18 ? 1050 : target < 2 ? 700 : 800;
    const duration = settling ? 350 : continuing ? Math.max(560, baseDuration * 0.8) : baseDuration;
    motion = { from, to: target, start: performance.now(), duration, settling };
    frame = requestAnimationFrame(tick);
  };
  const settle = () => {
    clearIdle();
    if (!continuous || disposed) return;
    continuous = false;
    lastIntent = null;
    wheel.reset();
    const current = scene();
    const nearest = STORY_STOPS.reduce((best, stop) => Math.abs(stop - current) < Math.abs(best - current) ? stop : best);
    goTo(nearest, false, false, true);
  };
  const flow = (delta: number, waitForRelease = false) => {
    stopMotion();
    clearIdle();
    continuous = true;
    arrived = null;
    // Equal input travels the same number of cards, even where the scene's coordinate gaps differ.
    // Start from the current position so interrupting a trip never jumps to its abandoned destination.
    const current = scene();
    const last = STORY_STOPS.length - 1;
    const upper = STORY_STOPS.findIndex(stop => stop > current);
    const lower = upper < 0 ? last : Math.max(0, upper - 1);
    const fraction = upper < 0 ? 0 : (current - STORY_STOPS[lower]) / (STORY_STOPS[upper] - STORY_STOPS[lower]);
    const position = Math.max(0, Math.min(last, lower + fraction + delta / 300));
    const index = Math.floor(position);
    const next = Math.min(last, index + 1);
    write(STORY_STOPS[index] + (STORY_STOPS[next] - STORY_STOPS[index]) * (position - index));
    if (!waitForRelease) idleTimer = setTimeout(settle, 180);
  };
  const advance = (direction: Direction, instant = false) => {
    const now = performance.now();
    const current = scene();
    if (!instant && !reducedMotion) {
      // A short gesture retains one destination. Sustained input bypasses this through flow().
      if (motion && Math.sign(motion.to - current) === direction) return;
      // Accept the very next gesture once the camera arrives. There is no timed hold at a stop;
      // only a genuinely lagging render can block departure before its card has appeared.
      if (arrived && arrived.direction === direction && Math.abs(current - arrived.target) < 0.002
        && Math.abs(renderedScene() - arrived.target) > 0.003) return;
    }
    const origin = motion && !instant ? renderedScene() : current;
    const target = direction > 0
      ? STORY_STOPS.find(stop => stop > origin + 0.001)
      : [...STORY_STOPS].reverse().find(stop => stop < origin - 0.001);
    if (target === undefined) return;
    const continuing = !!arrived && arrived.direction === direction && now - arrived.at < 850;
    goTo(target, instant, continuing);
  };
  const inPage = (target: Element | null) => !target || target === document.body || target === document.documentElement || root.contains(target);
  const native = (target: Element | null) => !inPage(target) || editable(target) || nestedScroller(target, root);
  const onWheel = (event: WheelEvent) => {
    const target = targetElement(event.target);
    if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || native(target)) {
      cancel();
      return;
    }
    if (!event.deltaY) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    const delta = event.deltaY * unit;
    const now = performance.now();
    const direction = wheel.push(delta, now);
    if (continuous || motion?.settling) {
      flow(delta);
    } else if (direction) {
      const repeated = lastIntent?.direction === direction && now - lastIntent.at < 450;
      const continuingTrip = motion && Math.sign(motion.to - scene()) === direction;
      if (repeated || continuingTrip) flow(delta);
      else advance(direction);
      lastIntent = { at: now, direction };
    }
  };
  const onKey = (event: KeyboardEvent) => {
    const target = targetElement(event.target);
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || control(target) || native(target)) return;
    const direction = event.key === "ArrowDown" || event.key === "PageDown" || (event.key === " " && !event.shiftKey) ? 1
      : event.key === "ArrowUp" || event.key === "PageUp" || (event.key === " " && event.shiftKey) ? -1 : 0;
    if (!direction && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    cancel();
    if (direction) advance(direction as Direction, true);
    else goTo(event.key === "Home" ? STORY_STOPS[0] : STORY_STOPS[STORY_STOPS.length - 1], true);
  };
  const onTouchStart = (event: TouchEvent) => {
    wheel.reset();
    clearIdle();
    continuous = false;
    lastIntent = null;
    if (event.touches.length !== 1 || native(targetElement(event.target))) {
      cancel();
      return;
    }
    const first = event.touches[0];
    touch = { x: first.clientX, y: first.clientY, anchorY: first.clientY, started: false, ignored: false };
  };
  const onTouchMove = (event: TouchEvent) => {
    if (!touch || touch.ignored) return;
    if (event.defaultPrevented || !event.cancelable || event.touches.length !== 1) {
      cancel();
      return;
    }
    const first = event.touches[0];
    const dy = touch.anchorY - first.clientY;
    if (!touch.started && Math.abs(first.clientX - touch.x) > Math.abs(touch.y - first.clientY)) {
      touch.ignored = true;
      return;
    }
    // Claim a vertical gesture before its tiny opening moves let native momentum take over.
    event.preventDefault();
    if (!touch.started && Math.abs(dy) < 12) return;
    if (continuous || (touch.started && Math.abs(dy) >= 125)) {
      flow(dy, true);
      touch.anchorY = first.clientY;
    } else if (!touch.started) {
      advance(Math.sign(dy) as Direction);
      touch.started = true;
      touch.anchorY = first.clientY;
    }
  };
  const onTouchEnd = () => {
    if (touch && continuous) settle();
    touch = null;
  };
  const onPointerDown = (event: PointerEvent) => {
    // A scrollbar drag or a click on a link takes over immediately. Ordinary canvas clicks remain available.
    if (event.clientX >= document.documentElement.clientWidth || control(targetElement(event.target))) cancel();
  };
  const onClick = (event: MouseEvent) => {
    if (targetElement(event.target)?.closest("a[href]")) cancel();
  };
  const onScroll = () => {
    // Anchor navigation, browser find, focus scrolling, and manual scrollbar movement take precedence.
    if ((motion || continuous) && Math.abs(scene() - writtenScene) > 0.002) cancel();
  };
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", cancel, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("click", onClick, true);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", cancel);
  window.addEventListener("hashchange", cancel);

  return {
    cancel,
    dispose() {
      disposed = true;
      cancel();
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", cancel);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", cancel);
      window.removeEventListener("hashchange", cancel);
    },
  };
}
