import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { TimelineItem } from "@/data/timeline";
import { CardDeck, paintMilestone, paintProject, type LabCard } from "./cards";
import { backgroundShader, finalShader, particleShader } from "./shaders";
import { buildShapes } from "./shapes";
import { CAMERA_FOV, INTRO, MORPHS, SHAPES, ambientFlow, cameraPoseAt, cursorRepel, introMorph, milestoneDissolve, milestonePlacement, milestoneReveal, morphAt, projectPlacement, projectReveal, swirlFor, type ShapeName } from "./timeline";

export type { LabCard };
export type LabFrame = { s: number; cameraY: number; cameraZ: number; velocity: number; introTime: number };
export type LabEngine = { dispose: () => void };
export type LabEngineOptions = {
  canvas: HTMLCanvasElement;
  reducedMotion: boolean;
  cards: LabCard[];
  milestones: TimelineItem[];
  sceneCoordinate: () => number;
  onReady: () => void;
  onFrame: (frame: LabFrame) => void;
  onHoverCard: (card: LabCard | null) => void;
  onOpenCard: (card: LabCard) => void;
};

const PALETTE = { particleA: "#7fdcd6", particleB: "#a99cf0", core: "#f4fffd", deep: "#03060a", mist: "#10303a", glow: "#1b5d68", edge: "#9cebe4" };
const damp = (rate: number, delta: number) => 1 - Math.exp(-rate * delta);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const isControl = (target: EventTarget | null) => target instanceof Element && !!target.closest("a, button, input, textarea, select, label, .site-header, .theme-preview");

// Returns null when WebGL is unavailable so the page can show its static layout.
export function createLabEngine(options: LabEngineOptions): LabEngine | null {
  const { canvas, reducedMotion } = options;
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  if (renderer.capabilities.maxVertexTextures === 0) {
    renderer.dispose();
    return null;
  }

  const compact = window.matchMedia("(max-width: 759px), (pointer: coarse)").matches;
  const side = compact ? 256 : 384;
  const count = side * side;
  // Phones are capped below their native ratio to keep the fill rate sane, but 1.5 left card text visibly soft: a
  // full-width card rasterized into only ~585 device pixels on a 390pt screen. 2 is the compromise.
  const dpr = Math.min(window.devicePixelRatio || 1, compact ? 2 : 1.75);
  renderer.setPixelRatio(dpr);
  // Measure the canvas's own box, never the window. On a phone the visual viewport shrinks and grows under the
  // browser's chrome while the canvas is pinned to the large viewport, and sizing to the window would leave the
  // drawing buffer disagreeing with the box the browser paints it into.
  const boxWidth = () => canvas.clientWidth || window.innerWidth;
  const boxHeight = () => canvas.clientHeight || window.innerHeight;
  // A phone's chrome grows and shrinks the visual viewport as the page scrolls, and viewport units follow it closely
  // enough that the canvas box moves underneath the drawing buffer. Pin the stage in script instead: hold the tallest
  // viewport seen at this width, and start again when the width changes, which is a rotation or a real relayout.
  const stage = canvas.parentElement;
  let pinnedWidth = 0;
  let pinnedHeight = 0;
  const pinStage = () => {
    if (!compact || !stage) return;
    if (window.innerWidth !== pinnedWidth) {
      pinnedWidth = window.innerWidth;
      pinnedHeight = 0;
    }
    pinnedHeight = Math.max(pinnedHeight, window.innerHeight);
    stage.style.height = `${pinnedHeight}px`;
  };
  pinStage();
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, boxWidth() / boxHeight(), 0.1, 420);
  const lookTarget = new THREE.Vector3();
  const lookOffset = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  // Drifting mist, drawn small and stretched behind everything.
  const backgroundTarget = new THREE.WebGLRenderTarget(256, 160, { type: THREE.HalfFloatType });
  const backgroundScene = new THREE.Scene();
  const backgroundCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const fullscreen = new THREE.BufferGeometry();
  fullscreen.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const backgroundMaterial = new THREE.ShaderMaterial({
    vertexShader: backgroundShader.vertex,
    fragmentShader: backgroundShader.fragment,
    uniforms: { uTime: { value: 0 }, uTravel: { value: 0 }, uResolution: { value: new THREE.Vector2(1, 1) }, uPointer: { value: new THREE.Vector2() }, uDeep: { value: new THREE.Color(PALETTE.deep) }, uMist: { value: new THREE.Color(PALETTE.mist) }, uGlow: { value: new THREE.Color(PALETTE.glow) } },
    depthTest: false,
    depthWrite: false,
  });
  const backgroundMesh = new THREE.Mesh(fullscreen, backgroundMaterial);
  backgroundMesh.frustumCulled = false;
  backgroundScene.add(backgroundMesh);
  scene.background = backgroundTarget.texture;

  const geometry = new THREE.BufferGeometry();
  const refs = new Float32Array(count * 2);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    refs[i * 2] = ((i % side) + 0.5) / side;
    refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
    for (let k = 0; k < 4; k++) seeds[i * 4 + k] = Math.random();
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aRef", new THREE.BufferAttribute(refs, 2));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: particleShader.vertex,
    fragmentShader: particleShader.fragment,
    uniforms: {
      uFrom: { value: null }, uTo: { value: null }, uMix: { value: 0 }, uTime: { value: 0 },
      uFlow: { value: reducedMotion ? 0 : 1 }, uSwirl: { value: 1 }, uPulseTime: { value: 0 },
      uPointer: { value: new THREE.Vector2(9, 9) }, uPointerForce: { value: 0 },
      uSize: { value: compact ? 0.05 : 0.042 }, uProjScale: { value: 1 },
      uColorA: { value: new THREE.Color(PALETTE.particleA) }, uColorB: { value: new THREE.Color(PALETTE.particleB) }, uColorCore: { value: new THREE.Color(PALETTE.core) },
      uOpacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, particleMaterial);
  points.frustumCulled = false;
  points.renderOrder = 2;

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dpr);
  composer.addPass(new RenderPass(scene, camera));
  // A higher threshold keeps the bloom off the readable core of text shapes and only lights up the brightest points.
  const bloom = new UnrealBloomPass(new THREE.Vector2(boxWidth(), boxHeight()), compact ? 0.32 : 0.38, 0.35, 0.5);
  composer.addPass(bloom);
  // Cards live in their own scene, drawn after the bloom so their text stays sharp.
  const overlay = new THREE.Scene();
  const overlayPass = new RenderPass(overlay, camera);
  overlayPass.clear = false;
  composer.addPass(overlayPass);
  const output = new OutputPass();
  composer.addPass(output);
  const finalPass = new ShaderPass(finalShader);
  finalPass.uniforms.uResolution.value = new THREE.Vector2(1, 1);
  finalPass.uniforms.uAberration.value = reducedMotion ? 0.0008 : 0.0015;
  composer.addPass(finalPass);

  let textures: Record<ShapeName, THREE.DataTexture> | null = null;
  let cards: CardDeck<LabCard> | null = null;
  let milestones: CardDeck<TimelineItem> | null = null;
  let builtAspect = camera.aspect;
  let disposed = false;
  let frameId = 0;
  let resizeTimer = 0;
  let sizedWidth = 0;
  let sizedHeight = 0;

  const resize = () => {
    pinStage();
    const width = boxWidth();
    const height = boxHeight();
    sizedWidth = width;
    sizedHeight = height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    backgroundTarget.setSize(Math.max(160, Math.round(width / 6)), Math.max(100, Math.round(height / 6)));
    backgroundMaterial.uniforms.uResolution.value.set(width, height);
    finalPass.uniforms.uResolution.value.set(width * dpr, height * dpr);
    particleMaterial.uniforms.uProjScale.value = (height * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    // Rebuild when the screen shape changes enough to crop the words, or crosses between the wide and narrow layouts.
    const crossedLayout = camera.aspect < 1 !== builtAspect < 1;
    if (textures && cards && milestones && (crossedLayout || Math.abs(camera.aspect - builtAspect) / builtAspect > 0.18)) {
      builtAspect = camera.aspect;
      const shapes = buildShapes(count, builtAspect);
      for (const name of SHAPES) {
        (textures[name].image.data as Float32Array).set(shapes[name]);
        textures[name].needsUpdate = true;
      }
      cards.layout(builtAspect);
      milestones.layout(builtAspect);
    }
  };
  const onResize = () => {
    pinStage();
    // The browser's chrome moving does not change the pinned box, so there is nothing to redraw for it.
    if (boxWidth() === sizedWidth && boxHeight() === sizedHeight) return;
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  };
  resize();

  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, force: 0, targetForce: 0, mouse: false };
  const drag = { active: false, lastX: 0, lastY: 0, travel: 0, yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 };
  const toPointer = (event: PointerEvent) => {
    pointer.targetX = (event.clientX / boxWidth()) * 2 - 1;
    pointer.targetY = -((event.clientY / boxHeight()) * 2 - 1);
  };
  const onPointerMove = (event: PointerEvent) => {
    toPointer(event);
    pointer.mouse = event.pointerType === "mouse";
    pointer.targetForce = 1;
    if (!drag.active) return;
    const dx = event.clientX - drag.lastX;
    const dy = event.clientY - drag.lastY;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.travel += Math.abs(dx) + Math.abs(dy);
    drag.targetYaw = clamp(drag.targetYaw - dx * 0.0035, -0.8, 0.8);
    drag.targetPitch = clamp(drag.targetPitch + dy * 0.0025, -0.45, 0.45);
    if (drag.travel > 6) document.documentElement.classList.add("lab-dragging");
  };
  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || isControl(event.target)) return;
    toPointer(event);
    drag.travel = 0;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.active = event.pointerType === "mouse";
    pointer.targetForce = 1;
  };
  const onPointerUp = (event: PointerEvent) => {
    const tapped = drag.travel < 6;
    drag.active = false;
    drag.targetYaw = 0;
    drag.targetPitch = 0;
    document.documentElement.classList.remove("lab-dragging");
    if (event.pointerType !== "mouse") pointer.targetForce = 0;
    if (!tapped || isControl(event.target) || !cards) return;
    const picked = cards.pick((event.clientX / boxWidth()) * 2 - 1, -((event.clientY / boxHeight()) * 2 - 1), camera);
    if (picked) options.onOpenCard(picked);
  };
  const onPointerOut = (event: PointerEvent) => {
    if (!event.relatedTarget) pointer.targetForce = 0;
  };

  let last = performance.now();
  let time = 0;
  let introTime = reducedMotion ? INTRO.end : 0;
  let s = options.sceneCoordinate();
  let previousS = s;
  let velocity = 0;
  let glitch = 0;
  let opacity = 0;
  let ready = false;

  const frame = (now: number) => {
    frameId = requestAnimationFrame(frame);
    if (document.hidden || !textures || !cards || !milestones) {
      last = now;
      return;
    }
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += delta;

    const raw = options.sceneCoordinate();
    s += (raw - s) * damp(7, delta);
    const speed = Math.abs(s - previousS) / Math.max(delta, 0.0001);
    previousS = s;
    velocity += (Math.min(1.2, speed * 0.9) - velocity) * damp(5, delta);

    const introBefore = introTime;
    if (introTime < INTRO.end) introTime = Math.min(INTRO.end, introTime + delta * (raw > 0.04 ? 5 : 1));
    const morph = introTime < INTRO.end && s < MORPHS[0].start ? introMorph(introTime) : morphAt(s);
    const uniforms = particleMaterial.uniforms;
    uniforms.uFrom.value = textures[morph.from];
    uniforms.uTo.value = textures[morph.to];
    uniforms.uMix.value = morph.mix;
    uniforms.uSwirl.value = swirlFor(morph);
    uniforms.uFlow.value = reducedMotion ? 0 : ambientFlow(s);

    // The glitch marks each time the opening word turns over; scrolling itself stays clean.
    const turnedAt = (at: number) => introBefore < at && introTime >= at;
    if (!reducedMotion && (turnedAt(INTRO.turn[0]) || turnedAt(INTRO.turn2[0]))) glitch = 0.8;
    glitch *= Math.exp(-delta * 5);

    pointer.x += (pointer.targetX - pointer.x) * damp(3, delta);
    pointer.y += (pointer.targetY - pointer.y) * damp(3, delta);
    pointer.force += (pointer.targetForce - pointer.force) * damp(4, delta);
    drag.yaw += (drag.targetYaw - drag.yaw) * damp(drag.active ? 8 : 1.6, delta);
    drag.pitch += (drag.targetPitch - drag.pitch) * damp(drag.active ? 8 : 1.6, delta);

    // The scroll pose comes from the choreography; dragging and the pointer only swing the camera around its target.
    const pose = cameraPoseAt(s, builtAspect);
    const sway = reducedMotion ? 0 : 1;
    const yaw = drag.yaw + pointer.x * 0.05 * sway;
    const pitch = drag.pitch + pointer.y * 0.035 * sway;
    lookTarget.set(pose.target[0], pose.target[1], pose.target[2]);
    lookOffset.set(pose.position[0] - pose.target[0], pose.position[1] - pose.target[1], pose.position[2] - pose.target[2]);
    lookOffset.applyAxisAngle(UP, yaw);
    lookOffset.y += Math.sin(pitch) * lookOffset.length();
    camera.position.copy(lookTarget).add(lookOffset);
    camera.lookAt(lookTarget);
    const cameraZ = camera.position.z;

    opacity += (1 - opacity) * damp(1.8, delta);
    uniforms.uTime.value = time;
    uniforms.uPulseTime.value = reducedMotion ? 0 : time;
    uniforms.uPointer.value.set(pointer.x, pointer.y);
    uniforms.uPointerForce.value = pointer.force * cursorRepel(s) * (reducedMotion ? 0.4 : 1);
    uniforms.uOpacity.value = opacity;

    cards.update(time, delta, camera, index => projectReveal(index, s), reducedMotion);
    milestones.update(time, delta, camera, index => milestoneReveal(index, s), reducedMotion, index => milestoneDissolve(index, s));
    const hover = cards.hover(pointer.targetX, pointer.targetY, camera, pointer.mouse && !drag.active);
    if (hover.changed) options.onHoverCard(hover.value);

    backgroundMaterial.uniforms.uTime.value = reducedMotion ? 0 : time;
    backgroundMaterial.uniforms.uTravel.value = cameraZ;
    backgroundMaterial.uniforms.uPointer.value.set(pointer.x, pointer.y);
    finalPass.uniforms.uTime.value = time;
    finalPass.uniforms.uGlitch.value = glitch;

    renderer.setRenderTarget(backgroundTarget);
    renderer.render(backgroundScene, backgroundCamera);
    renderer.setRenderTarget(null);
    composer.render(delta);

    options.onFrame({ s, cameraY: camera.position.y, cameraZ, velocity, introTime });
    if (!ready) {
      ready = true;
      options.onReady();
    }
  };

  // Words are sampled from rendered text, so wait briefly for the web fonts.
  const fonts = document.fonts
    ? Promise.all([document.fonts.load('700 140px "Space Grotesk"'), document.fonts.load('600 140px "Space Grotesk"'), document.fonts.load('500 24px "JetBrains Mono"')])
    : Promise.resolve();
  void Promise.race([fonts, new Promise(resolve => window.setTimeout(resolve, 1800))]).catch(() => undefined).then(() => {
    if (disposed) return;
    const shapes = buildShapes(count, builtAspect);
    textures = Object.fromEntries(SHAPES.map(name => {
      const texture = new THREE.DataTexture(shapes[name], side, side, THREE.RGBAFormat, THREE.FloatType);
      texture.minFilter = THREE.NearestFilter;
      texture.magFilter = THREE.NearestFilter;
      texture.needsUpdate = true;
      return [name, texture];
    })) as Record<ShapeName, THREE.DataTexture>;
    cards = new CardDeck(options.cards, paintProject, (index, aspect) => {
      const place = projectPlacement(index, aspect);
      return { position: place.card, scale: place.scale };
    }, builtAspect, PALETTE.edge);
    milestones = new CardDeck(options.milestones, paintMilestone, (index, aspect) => {
      const place = milestonePlacement(index, aspect);
      return { position: place.card, scale: place.scale, normal: place.normal };
    }, builtAspect, PALETTE.edge, { attached: true });
    scene.add(points);
    overlay.add(cards.group, milestones.group);
    last = performance.now();
    frameId = requestAnimationFrame(frame);
  });

  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointerout", onPointerOut);

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointerout", onPointerOut);
      document.documentElement.classList.remove("lab-dragging");
      geometry.dispose();
      particleMaterial.dispose();
      if (textures) Object.values(textures).forEach(texture => texture.dispose());
      cards?.dispose();
      milestones?.dispose();
      fullscreen.dispose();
      backgroundMaterial.dispose();
      backgroundTarget.dispose();
      bloom.dispose();
      output.dispose();
      finalPass.dispose();
      composer.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
