import * as THREE from "three";
import type { TimelineItem } from "@/data/timeline";
import { cardShader } from "./shaders";
import { CARD_SIZE } from "./timeline";

export type LabCard = { title: string; category: string; tags: string[]; link?: string };
// With a `normal`, the card is fixed facing that way in the scene; without one, it always turns to face the camera.
export type CardPlace = { position: readonly [number, number, number]; scale: number; normal?: readonly [number, number, number] };

const { width: WIDTH, height: HEIGHT } = CARD_SIZE;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function wrap(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Card faces are drawn at full resolution everywhere: at three quarters the text was softer than the phone's render
// buffer, so the saving cost sharpness the device could actually resolve.
const TEXTURE_RESOLUTION = 1;

// The shared card face: a dark rounded panel with flow lines unique to its seed and a shade for the text side. Drawing
// happens in 1024 x 640 units regardless of the canvas's actual resolution.
function surface(seedIndex: number) {
  const width = 1024;
  const height = 640;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * TEXTURE_RESOLUTION);
  canvas.height = Math.round(height * TEXTURE_RESOLUTION);
  const context = canvas.getContext("2d");
  if (!context) return { canvas, context, width, height };
  context.scale(TEXTURE_RESOLUTION, TEXTURE_RESOLUTION);

  const frame = () => {
    context.beginPath();
    context.roundRect(4, 4, width - 8, height - 8, 34);
  };
  frame();
  const fill = context.createLinearGradient(0, 0, width, height);
  fill.addColorStop(0, "rgba(17, 29, 37, 0.95)");
  fill.addColorStop(1, "rgba(7, 11, 17, 0.92)");
  context.fillStyle = fill;
  context.fill();

  context.save();
  frame();
  context.clip();
  context.globalCompositeOperation = "lighter";
  let seed = (seedIndex + 1) * 9301;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 80; i++) {
    context.strokeStyle = i % 4 === 0 ? `rgba(192, 184, 239, ${0.05 + random() * 0.12})` : `rgba(156, 235, 228, ${0.04 + random() * 0.12})`;
    context.lineWidth = 1 + random() * 1.4;
    context.beginPath();
    let x = width * 0.38;
    let y = random() * height;
    context.moveTo(x, y);
    for (let s = 0; s < 16; s++) {
      x += width * 0.042;
      y += Math.sin(s * 0.55 + i * 0.27 + seedIndex) * 16 + (random() - 0.5) * 8;
      context.lineTo(x, y);
    }
    context.stroke();
  }
  context.globalCompositeOperation = "source-over";
  const shade = context.createLinearGradient(0, 0, width * 0.75, 0);
  shade.addColorStop(0, "rgba(6, 10, 14, 0.9)");
  shade.addColorStop(1, "rgba(6, 10, 14, 0)");
  context.fillStyle = shade;
  context.fillRect(0, 0, width, height);
  context.restore();

  frame();
  context.lineWidth = 2;
  context.strokeStyle = "rgba(185, 233, 230, 0.26)";
  context.stroke();
  context.textBaseline = "alphabetic";
  return { canvas, context, width, height };
}

export function paintProject(card: LabCard, index: number) {
  const { canvas, context, width, height } = surface(index);
  if (!context) return canvas;
  context.font = '500 24px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(170, 188, 196, 0.8)";
  context.fillText(card.category.toUpperCase(), 64, 94);
  context.textAlign = "right";
  context.fillText(card.link ? "OPEN" : "PRIVATE", width - 64, 94);
  context.textAlign = "left";

  context.font = '700 76px "Space Grotesk", sans-serif';
  context.fillStyle = "#e9f0f2";
  const lines = wrap(context, card.title, 780).slice(0, 2);
  lines.forEach((line, i) => context.fillText(line, 60, height - 118 - (lines.length - 1 - i) * 80));

  context.font = '400 21px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(170, 188, 196, 0.78)";
  context.fillText(card.tags.slice(0, 4).join("  /  ").toUpperCase(), 64, height - 64);
  return canvas;
}

export function paintMilestone(item: TimelineItem, index: number) {
  const { canvas, context, height } = surface(index + 11);
  if (!context) return canvas;
  context.font = '500 24px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(170, 188, 196, 0.8)";
  context.fillText((item.period ?? "Next").replace(/ - /g, " to ").toUpperCase(), 64, 94);

  // Laid out from the bottom up so long companies and titles push upward instead of off the card.
  context.font = '500 21px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(156, 235, 228, 0.7)";
  context.fillText(item.chapter.toUpperCase(), 64, height - 60);

  context.font = '400 30px "Space Grotesk", sans-serif';
  context.fillStyle = "rgba(214, 226, 230, 0.9)";
  const titleLines = wrap(context, item.title, 880).slice(0, 2);
  const titleBottom = height - 112;
  titleLines.forEach((line, i) => context.fillText(line, 62, titleBottom - (titleLines.length - 1 - i) * 38));

  context.font = '700 62px "Space Grotesk", sans-serif';
  context.fillStyle = "#e9f0f2";
  const companyLines = wrap(context, item.company, 880).slice(0, 2);
  const companyBottom = titleBottom - (titleLines.length - 1) * 38 - 52;
  companyLines.forEach((line, i) => context.fillText(line, 60, companyBottom - (companyLines.length - 1 - i) * 66));
  return canvas;
}

type Item<T> = { value: T; mesh: THREE.Mesh; material: THREE.ShaderMaterial; texture: THREE.CanvasTexture; hover: number; home: THREE.Vector3; normal: THREE.Vector3 | null };

// Cards that stand at fixed points in the scene and always turn to face the camera, so they read from any angle.
export class CardDeck<T> {
  readonly group = new THREE.Group();
  private readonly geometry = new THREE.PlaneGeometry(WIDTH, HEIGHT, 24, 1);
  private readonly items: Item<T>[];
  private readonly place: (index: number, aspect: number) => CardPlace;
  private readonly bob: boolean;
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly toCamera = new THREE.Vector3();
  private readonly facing = new THREE.Vector3();
  private hovered: Item<T> | null = null;

  // `attached` cards stay fixed to their spot and fade instead of dissolving or bobbing.
  constructor(values: T[], paint: (value: T, index: number) => HTMLCanvasElement, place: (index: number, aspect: number) => CardPlace, aspect: number, edge: string, { attached = false } = {}) {
    this.place = place;
    this.bob = !attached;
    this.items = values.map((value, index) => {
      const texture = new THREE.CanvasTexture(paint(value, index));
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      const material = new THREE.ShaderMaterial({
        vertexShader: cardShader.vertex,
        fragmentShader: cardShader.fragment,
        uniforms: { uMap: { value: texture }, uReveal: { value: 0 }, uHover: { value: 0 }, uTime: { value: 0 }, uSeed: { value: index * 3.7 }, uEdge: { value: new THREE.Color(edge) }, uDissolve: { value: attached ? 0 : 1 }, uDetail: { value: attached ? 7 : 1 } },
        transparent: true,
        premultipliedAlpha: true,
        side: THREE.DoubleSide,
        // Drawn over everything so a stair rail, strand, or drifting particle never cuts across the text.
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      mesh.renderOrder = 10;
      mesh.visible = false;
      this.group.add(mesh);
      return { value, mesh, material, texture, hover: 0, home: new THREE.Vector3(), normal: null };
    });
    this.layout(aspect);
  }

  layout(aspect: number) {
    this.items.forEach((item, index) => {
      const place = this.place(index, aspect);
      item.home.set(place.position[0], place.position[1], place.position[2]);
      item.normal = place.normal ? new THREE.Vector3(place.normal[0], place.normal[1], place.normal[2]).normalize() : null;
      item.mesh.scale.setScalar(place.scale);
    });
  }

  // Call after the camera has been positioned for the frame.
  // `dissolve` switches an attached card to the noise dissolve (1) or a plain fade (0) as it reveals or hides.
  update(time: number, delta: number, camera: THREE.Camera, reveal: (index: number) => number, still: boolean, dissolve?: (index: number) => number) {
    const blend = 1 - Math.exp(-delta * 8);
    this.items.forEach((item, index) => {
      const amount = clamp01(reveal(index));
      const eased = amount * amount * (3 - 2 * amount);
      item.hover += ((this.hovered === item ? 1 : 0) - item.hover) * blend;
      const uniforms = item.material.uniforms;
      uniforms.uReveal.value = eased;
      uniforms.uHover.value = item.hover;
      uniforms.uTime.value = time;
      if (dissolve) uniforms.uDissolve.value = dissolve(index);
      item.mesh.visible = eased > 0.001;
      if (!item.mesh.visible) return;
      this.toCamera.copy(camera.position).sub(item.home).normalize();
      item.mesh.position.copy(item.home).addScaledVector(this.toCamera, item.hover * 0.35);
      if (this.bob && !still) item.mesh.position.y += Math.sin(time * 0.7 + index * 1.7) * 0.08;
      if (item.normal) item.mesh.lookAt(this.facing.copy(item.mesh.position).add(item.normal));
      else item.mesh.quaternion.copy(camera.quaternion);
    });
  }

  private pickItem(x: number, y: number, camera: THREE.Camera) {
    this.pointer.set(x, y);
    this.raycaster.setFromCamera(this.pointer, camera);
    const ready = this.items.filter(item => item.mesh.visible && item.material.uniforms.uReveal.value > 0.6);
    const hit = this.raycaster.intersectObjects(ready.map(item => item.mesh), false)[0];
    return ready.find(item => item.mesh === hit?.object) ?? null;
  }

  pick(x: number, y: number, camera: THREE.Camera) {
    return this.pickItem(x, y, camera)?.value ?? null;
  }

  hover(x: number, y: number, camera: THREE.Camera, enabled: boolean) {
    const next = enabled ? this.pickItem(x, y, camera) : null;
    const changed = next !== this.hovered;
    this.hovered = next;
    return { value: next?.value ?? null, changed };
  }

  dispose() {
    this.geometry.dispose();
    this.items.forEach(item => {
      item.material.dispose();
      item.texture.dispose();
    });
  }
}
