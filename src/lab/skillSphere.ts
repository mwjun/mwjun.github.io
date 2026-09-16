import * as THREE from "three";
import { CATEGORY_COLORS, SKILLS, layoutGrid, type SkillEntry } from "./skillSearch";

// The v4 skills page: a full-screen sphere with a glowing dot for every skill, grouped into bands by discipline.
// When a search is active the sphere recedes and dims, and the matching dots fly out to a labeled grid in front.

const DOT_VERTEX = /* glsl */ `
attribute vec3 aColor;
attribute float aSize;
attribute float aAlpha;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vAlpha;
void main() {
  vColor = aColor;
  vAlpha = aAlpha;
  vec4 view = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * view;
}
`;
const DOT_FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  // A bright pinpoint inside a soft colored halo, like the atom's dots.
  float core = smoothstep(0.13, 0.03, d);
  float halo = smoothstep(0.5, 0.0, d);
  float alpha = (core + halo * halo * 0.55) * vAlpha;
  if (alpha < 0.005) discard;
  gl_FragColor = vec4(mix(vColor, vec3(1.0), core * 0.5), min(alpha, 1.0));
}
`;
const DUST_VERTEX = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
uniform float uPixelRatio;
uniform float uCenterZ;
uniform float uRadius;
varying float vAlpha;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  // Brighter on the side facing the camera so the sphere reads as a solid.
  float front = clamp((world.z - uCenterZ) / uRadius * 0.5 + 0.5, 0.0, 1.0);
  vAlpha = aAlpha * (0.25 + front * 0.75);
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;
const DUST_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uDim;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float alpha = smoothstep(0.5, 0.1, d) * vAlpha * uDim;
  if (alpha < 0.004) discard;
  gl_FragColor = vec4(uColor, alpha);
}
`;

export type SkillSphere = {
  setResults: (results: SkillEntry[], focused: boolean) => void;
  dispose: () => void;
};

type Options = {
  canvas: HTMLCanvasElement;
  labels: (HTMLElement | null)[];
  reducedMotion: boolean;
  onPick: (entry: SkillEntry) => void;
  // A tap that lands on no dot, which the page treats as leaving the selection.
  onDismiss: () => void;
  onVisibleCount: (shown: number) => void;
};

const damp = (rate: number, delta: number) => 1 - Math.exp(-rate * delta);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const CAMERA_Z = 10;
const LAYOUT_Z = 3;

export function createSkillSphere({ canvas, labels, reducedMotion, onPick, onDismiss, onVisibleCount }: Options): SkillSphere | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 0, CAMERA_Z);
  const sphere = new THREE.Group();
  scene.add(sphere);

  const count = SKILLS.length;
  const golden = Math.PI * (3 - Math.sqrt(5));
  // Unit-sphere home for each skill. Skills are ordered by discipline, so the lattice gives each one a band.
  const homes = SKILLS.map((_, i) => {
    const y = 1 - ((i + 0.5) / count) * 2;
    const ring = Math.sqrt(1 - y * y);
    return new THREE.Vector3(Math.cos(golden * i) * ring, y, Math.sin(golden * i) * ring);
  });

  // Dust shell and orbit rings live inside the sphere group and simply inherit its transform.
  const dustCount = 5200;
  const dustPositions = new Float32Array(dustCount * 3);
  const dustSizes = new Float32Array(dustCount);
  const dustAlphas = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    const y = 1 - ((i + 0.5) / dustCount) * 2;
    const ring = Math.sqrt(1 - y * y);
    const r = 1 + (Math.random() - 0.5) * 0.04;
    dustPositions[i * 3] = Math.cos(golden * i * 1.0003) * ring * r;
    dustPositions[i * 3 + 1] = y * r;
    dustPositions[i * 3 + 2] = Math.sin(golden * i * 1.0003) * ring * r;
    dustSizes[i] = 1.6 + Math.random() * 2;
    dustAlphas[i] = 0.2 + Math.random() * 0.35;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSize", new THREE.BufferAttribute(dustSizes, 1));
  dustGeometry.setAttribute("aAlpha", new THREE.BufferAttribute(dustAlphas, 1));
  const dustMaterial = new THREE.ShaderMaterial({
    vertexShader: DUST_VERTEX,
    fragmentShader: DUST_FRAGMENT,
    uniforms: { uPixelRatio: { value: dpr }, uCenterZ: { value: 0 }, uRadius: { value: 1 }, uColor: { value: new THREE.Color("#9fe3de") }, uDim: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  sphere.add(dust);

  const ringMaterial = new THREE.LineBasicMaterial({ color: "#b9e9e6", transparent: true, opacity: 0.14, depthWrite: false, blending: THREE.AdditiveBlending });
  const ringGeometry = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 160 }, (_, i) => new THREE.Vector3(Math.cos((i / 160) * Math.PI * 2) * 1.12, 0, Math.sin((i / 160) * Math.PI * 2) * 1.12)));
  const rings = [0.35, -0.9, 1.35].map((tilt, i) => {
    const ring = new THREE.LineLoop(ringGeometry, ringMaterial);
    ring.rotation.set(tilt, i * 1.1, i * 0.4);
    sphere.add(ring);
    return ring;
  });

  // Threads between each skill and its nearest neighbor in the same discipline.
  const linkPairs: [number, number][] = [];
  SKILLS.forEach((entry, i) => {
    let best = -1;
    let bestDistance = Infinity;
    SKILLS.forEach((other, j) => {
      if (j === i || other.groupIndex !== entry.groupIndex) return;
      const distance = homes[i].distanceToSquared(homes[j]);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = j;
      }
    });
    if (best >= 0 && !linkPairs.some(([a, b]) => a === best && b === i)) linkPairs.push([i, best]);
  });
  const linkGeometry = new THREE.BufferGeometry();
  linkGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linkPairs.flatMap(([a, b]) => [...homes[a].toArray(), ...homes[b].toArray()])), 3));
  const linkMaterial = new THREE.LineBasicMaterial({ color: "#8fd8d2", transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending });
  const links = new THREE.LineSegments(linkGeometry, linkMaterial);
  sphere.add(links);

  // Skill dots are positioned in world space every frame, since they leave the sphere when they match a search.
  const dotPositions = new Float32Array(count * 3);
  const dotColors = new Float32Array(count * 3);
  const dotSizes = new Float32Array(count);
  const dotAlphas = new Float32Array(count);
  SKILLS.forEach((entry, i) => new THREE.Color(CATEGORY_COLORS[entry.groupIndex % CATEGORY_COLORS.length]).toArray(dotColors, i * 3));
  const dotGeometry = new THREE.BufferGeometry();
  const dotPositionAttribute = new THREE.BufferAttribute(dotPositions, 3).setUsage(THREE.DynamicDrawUsage);
  const dotSizeAttribute = new THREE.BufferAttribute(dotSizes, 1).setUsage(THREE.DynamicDrawUsage);
  const dotAlphaAttribute = new THREE.BufferAttribute(dotAlphas, 1).setUsage(THREE.DynamicDrawUsage);
  dotGeometry.setAttribute("position", dotPositionAttribute);
  dotGeometry.setAttribute("aColor", new THREE.BufferAttribute(dotColors, 3));
  dotGeometry.setAttribute("aSize", dotSizeAttribute);
  dotGeometry.setAttribute("aAlpha", dotAlphaAttribute);
  const dotMaterial = new THREE.ShaderMaterial({
    vertexShader: DOT_VERTEX,
    fragmentShader: DOT_FRAGMENT,
    uniforms: { uPixelRatio: { value: dpr } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dots = new THREE.Points(dotGeometry, dotMaterial);
  dots.frustumCulled = false;
  dots.renderOrder = 2;
  scene.add(dots);

  let width = 1;
  let height = 1;
  let radius = 2.9;
  let compact = false;
  const layoutTargets: (THREE.Vector3 | null)[] = new Array(count).fill(null);
  let results: SkillEntry[] = [];
  let focused = false;

  const worldAt = (x: number, y: number, z: number, out: THREE.Vector3) => {
    const visibleHeight = 2 * (CAMERA_Z - z) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const perPixel = visibleHeight / height;
    return out.set((x - width / 2) * perPixel, -(y - height / 2) * perPixel, z);
  };

  const relayout = () => {
    layoutTargets.fill(null);
    if (!focused) {
      onVisibleCount(0);
      return;
    }
    const longest = results.reduce((most, entry) => Math.max(most, entry.skill.length), 0);
    const grid = layoutGrid(results.length, width, height, compact, longest);
    grid.positions.forEach(([x, y], i) => {
      layoutTargets[results[i].index] = worldAt(x, y, LAYOUT_Z, new THREE.Vector3());
    });
    // Names that still don't fit the column (only possible on the narrowest screens) end in an ellipsis.
    labels.find(Boolean)?.parentElement?.style.setProperty("--ts-cell", `${Math.round(grid.cellWidth - 24)}px`);
    onVisibleCount(grid.shown);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    compact = width < 760;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    // Fill most of the screen: 76% of the height, or 82% of the width on portrait screens.
    const visibleHeight = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    radius = Math.min(visibleHeight * 0.38, visibleHeight * camera.aspect * 0.409);
    relayout();
  };
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // Pointer: drag spins the sphere with inertia, hover names a dot, a click without dragging picks it, and a
  // click that misses every dot clears the selection.
  const pointer = new THREE.Vector2(9, 9);
  const drag = { active: false, moved: 0, lastX: 0, lastY: 0, spinX: 0, spinY: 0 };
  let hovered = -1;
  const toNdc = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  };
  const onPointerDown = (event: PointerEvent) => {
    drag.active = true;
    drag.moved = 0;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent) => {
    toNdc(event);
    if (!drag.active) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.spinY = dx * 0.005;
    drag.spinX = dy * 0.005;
    sphere.rotation.y += drag.spinY;
    sphere.rotation.x = THREE.MathUtils.clamp(sphere.rotation.x + drag.spinX, -1.2, 1.2);
  };
  const onPointerUp = (event: PointerEvent) => {
    if (!drag.active) return;
    drag.active = false;
    if (drag.moved < 6) {
      toNdc(event);
      const index = pick();
      // Tapping a dot picks it; tapping past them all is the way back out, so leaving a selection never means hunting
      // for the clear button.
      if (index >= 0) onPick(SKILLS[index]);
      else onDismiss();
    }
  };
  const onPointerLeave = () => pointer.set(9, 9);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);

  // Screen-space picking against the dots' current positions; dots that are hidden behind a search don't count.
  const projected = new THREE.Vector3();
  const pick = () => {
    let best = -1;
    let bestDistance = (compact ? 26 : 18) ** 2;
    for (let i = 0; i < count; i++) {
      if (dotAlphas[i] < 0.5) continue;
      projected.set(dotPositions[i * 3], dotPositions[i * 3 + 1], dotPositions[i * 3 + 2]).project(camera);
      const dx = ((projected.x - pointer.x) * width) / 2;
      const dy = ((projected.y - pointer.y) * height) / 2;
      const distance = dx * dx + dy * dy;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    }
    return best;
  };

  const lift = new Float32Array(count);
  const match = new Float32Array(count);
  const labelShown = new Uint8Array(count);
  let focus = 0;
  let idle = 0;
  let last = performance.now();
  let frameId = 0;
  const world = new THREE.Vector3();
  const home = new THREE.Vector3();
  const centerOnScreen = new THREE.Vector3();

  const frame = (now: number) => {
    frameId = requestAnimationFrame(frame);
    if (document.hidden) {
      last = now;
      return;
    }
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    const rate = reducedMotion ? 60 : 1;

    focus += ((focused ? 1 : 0) - focus) * damp(2.4 * rate, delta);
    const eased = easeInOut(focus);
    if (!drag.active) {
      idle += delta;
      sphere.rotation.y += (reducedMotion ? 0 : 0.08) * delta + drag.spinY * Math.exp(-idle * 3);
      sphere.rotation.x += (0.12 - sphere.rotation.x) * damp(0.6, delta) * (idle > 1.5 ? 1 : 0) + drag.spinX * Math.exp(-idle * 3);
    } else {
      idle = 0;
    }
    // Recede into the background while a search is up.
    sphere.position.set(0, eased * 0.5, -eased * 7);
    sphere.scale.setScalar(radius * (1 - eased * 0.2));
    sphere.updateMatrixWorld();
    dustMaterial.uniforms.uCenterZ.value = sphere.position.z;
    dustMaterial.uniforms.uRadius.value = radius;
    // Dimmed, not hidden: the sphere should still read in the background while results are up front.
    dustMaterial.uniforms.uDim.value = 1 - eased * 0.45;
    linkMaterial.opacity = 0.16 * (1 - eased * 0.55);
    ringMaterial.opacity = 0.14 * (1 - eased * 0.45);

    hovered = drag.active ? -1 : pick();
    canvas.style.cursor = drag.active ? "grabbing" : hovered >= 0 ? "pointer" : "grab";
    centerOnScreen.copy(sphere.position);

    for (let i = 0; i < count; i++) {
      const target = layoutTargets[i];
      lift[i] += ((target ? 1 : 0) - lift[i]) * damp((target ? 2.6 : 4) * rate, delta);
      const isMatch = focused && results.some(entry => entry.index === i);
      match[i] += ((isMatch ? 1 : 0) - match[i]) * damp(5 * rate, delta);
      home.copy(homes[i]).applyMatrix4(sphere.matrixWorld);
      const t = easeInOut(Math.min(1, lift[i]));
      if (target) world.copy(home).lerp(target, t);
      else world.copy(home);
      world.toArray(dotPositions, i * 3);

      const front = THREE.MathUtils.clamp((home.z - centerOnScreen.z) / radius * 0.5 + 0.5, 0, 1);
      const onSphere = (0.35 + front * 0.65) * (1 - eased * 0.55 * (1 - match[i]));
      dotAlphas[i] = Math.max(onSphere, t);
      const base = compact ? 17 : 24;
      dotSizes[i] = base * (0.6 + front * 0.5) * (1 - eased * 0.2) + t * base * 0.35 + match[i] * (1 - t) * base * 0.3 + (i === hovered ? base * 0.5 : 0);

      const label = labels[i];
      if (!label) continue;
      const labelOpacity = Math.max(t > 0.55 ? (t - 0.55) / 0.45 : 0, i === hovered ? 1 : 0);
      if (labelOpacity > 0.01) {
        projected.copy(world).project(camera);
        const x = (projected.x * 0.5 + 0.5) * width;
        const y = (-projected.y * 0.5 + 0.5) * height;
        label.style.opacity = labelOpacity.toFixed(3);
        label.style.transform = `translate3d(${(x + 14).toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
        label.classList.toggle("is-hover", i === hovered && t < 0.55);
        labelShown[i] = 1;
      } else if (labelShown[i]) {
        label.style.opacity = "0";
        labelShown[i] = 0;
      }
    }
    dotPositionAttribute.needsUpdate = true;
    dotSizeAttribute.needsUpdate = true;
    dotAlphaAttribute.needsUpdate = true;
    rings.forEach((ring, i) => (ring.rotation.z += delta * 0.03 * (i + 1) * (reducedMotion ? 0 : 1)));

    renderer.render(scene, camera);
  };
  frameId = requestAnimationFrame(frame);

  return {
    setResults(next, nextFocused) {
      results = next;
      focused = nextFocused;
      relayout();
    },
    dispose() {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      [dustGeometry, ringGeometry, linkGeometry, dotGeometry].forEach(geometry => geometry.dispose());
      [dustMaterial, ringMaterial, linkMaterial, dotMaterial].forEach(material => material.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
