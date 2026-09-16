// GLSL for the Test page scene.

// 3D simplex noise by Ian McEwan and Ashima Arts (MIT license).
const NOISE = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

export const particleShader = {
  vertex: /* glsl */ `
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform float uMix;
uniform float uTime;
uniform float uFlow;
uniform float uSwirl;
uniform vec2 uPointer;
uniform float uPointerForce;
uniform float uSize;
uniform float uProjScale;
attribute vec2 aRef;
attribute vec4 aSeed;
varying float vAlpha;
varying float vTone;
uniform float uPulseTime;
${NOISE}
// Brightness lives in w. From 2 up it marks a synapse particle: the integer part is its pulse group and the fraction how
// far down the synapse it sits, so a comet of light runs down each connection over time.
float brightnessOf(float w) {
  if (w < 2.0) return w;
  float along = fract(w);
  float phase = fract(along - uPulseTime * 0.3 + (floor(w) - 2.0) * 0.173);
  return 0.16 + pow(phase, 14.0) * 1.1;
}
void main() {
  vec4 a = texture2D(uFrom, aRef);
  vec4 b = texture2D(uTo, aRef);
  // Staggered so a morph travels through the cloud as a wave.
  float delay = aSeed.x * 0.4;
  float m = clamp((uMix - delay) / 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(a.xyz, b.xyz, m);
  float flight = sin(m * 3.14159265);
  vec3 q = p * 0.16 + vec3(0.0, 0.0, uTime * 0.07);
  vec3 swirl = vec3(snoise(q), snoise(q + 17.1), snoise(q + 41.7));
  // uSwirl scatters particles through noise mid-morph; with it off they travel straight to their new shape.
  p += swirl * (flight * uSwirl * (2.0 + aSeed.y * 3.0) + uFlow * (0.04 + aSeed.y * 0.1));

  vec4 view = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * view;
  vec2 away = clip.xy / max(clip.w, 0.0001) - uPointer;
  float push = exp(-dot(away, away) * 26.0) * uPointerForce * step(0.0, clip.w);
  view.xy += normalize(away + 0.00001) * push * -view.z * 0.07;
  gl_Position = projectionMatrix * view;

  float brightness = mix(brightnessOf(a.w), brightnessOf(b.w), m);
  float depth = max(-view.z, 0.001);
  float size = uSize * (0.55 + aSeed.z * 0.9) * (0.6 + brightness * 0.6);
  gl_PointSize = min(size * uProjScale / depth, 64.0);
  float lens = smoothstep(0.3, 2.4, depth);
  float haze = 1.0 - smoothstep(60.0, 110.0, depth);
  float twinkle = 0.8 + 0.2 * sin(uTime * (1.1 + aSeed.w * 2.0) + aSeed.w * 60.0);
  vAlpha = brightness * lens * haze * twinkle * (1.0 + flight * uSwirl * 0.4);
  vTone = fract(aSeed.w * 7.13);
}
`,
  fragment: /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorCore;
uniform float uOpacity;
varying float vAlpha;
varying float vTone;
void main() {
  float d = length(gl_PointCoord - 0.5);
  // A small solid core plus a soft skirt: the core stays under the bloom threshold so it reads as crisp
  // shape, while the skirt is what actually blooms, giving a backlit rim instead of a flat glowing blob.
  float core = smoothstep(0.16, 0.02, d);
  float skirt = smoothstep(0.5, 0.05, d);
  vec3 color = mix(uColorA, uColorB, smoothstep(0.55, 0.95, vTone));
  color = mix(color, uColorCore, core * 0.6);
  float alpha = (core * 0.92 + skirt * skirt * 0.22) * vAlpha * uOpacity;
  if (alpha < 0.002) discard;
  gl_FragColor = vec4(color, alpha);
}
`,
};

export const backgroundShader = {
  vertex: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
  fragment: /* glsl */ `
uniform float uTime;
uniform float uTravel;
uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uDeep;
uniform vec3 uMist;
uniform vec3 uGlow;
varying vec2 vUv;
${NOISE}
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }
  return value;
}
void main() {
  vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0);
  float clouds = fbm(vec3(p * 1.3 + uPointer * 0.03, uTime * 0.025 + uTravel * 0.01));
  float low = smoothstep(0.85, -0.5, vUv.y);
  vec3 color = mix(uDeep, uMist, smoothstep(-0.25, 0.75, clouds) * (0.3 + low * 0.5));
  color += uGlow * pow(max(0.0, 1.0 - length(p - vec2(0.0, -0.05)) * 1.05), 3.0) * 0.22;
  gl_FragColor = vec4(color, 1.0);
}
`,
};

export const cardShader = {
  vertex: /* glsl */ `
uniform float uReveal;
uniform float uDissolve;
uniform float uDetail;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec3 p = position;
  p.z -= sin(uv.x * 3.14159265) * (1.0 - uReveal) * 0.5 * uDissolve / uDetail;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`,
  fragment: /* glsl */ `
uniform sampler2D uMap;
uniform float uReveal;
uniform float uHover;
uniform float uTime;
uniform float uSeed;
uniform vec3 uEdge;
uniform float uDissolve;
// Grain of the dissolve. Higher values break the card into finer dust with a thinner, softer edge and less color
// split, for cards seen up close.
uniform float uDetail;
varying vec2 vUv;
${NOISE}
void main() {
  // Noise dissolve that sweeps upward, with a hot edge while it resolves.
  float n = snoise(vec3(vUv * vec2(3.4, 2.1) * uDetail, uSeed)) * 0.5 + 0.5;
  n = n * 0.7 + (1.0 - vUv.y) * 0.3;
  float threshold = uReveal * 1.3 - 0.15;
  float grain = sqrt(uDetail);
  float visible = 1.0 - smoothstep(threshold - 0.01, threshold, n);
  float edge = smoothstep(threshold - 0.08 / grain, threshold, n) * visible * (1.0 - smoothstep(0.9, 1.0, uReveal));
  // Without the dissolve, the card simply fades with uReveal.
  visible = mix(uReveal, visible, uDissolve);
  edge *= uDissolve / grain;
  float shift = (1.0 - uReveal) * 0.025 * uDissolve / uDetail + uHover * 0.002;
  vec4 base = texture2D(uMap, vUv);
  vec3 color = vec3(texture2D(uMap, vUv + vec2(shift, 0.0)).r, base.g, texture2D(uMap, vUv - vec2(shift, 0.0)).b);
  color *= 0.94 + 0.06 * sin(vUv.y * 380.0 - uTime * 4.0);
  color += uEdge * uHover * 0.1 * (1.0 - vUv.y);
  float alpha = base.a * visible;
  float outAlpha = max(alpha, edge);
  if (outAlpha < 0.01) discard;
  gl_FragColor = vec4(color * alpha + uEdge * edge * 2.5, outAlpha);
}
`,
};

export const finalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGlitch: { value: 0 },
    uAberration: { value: 0.0015 },
    uResolution: { value: [1, 1] },
  },
  vertexShader: /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uGlitch;
uniform float uAberration;
uniform vec2 uResolution;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = vUv;
  if (uGlitch > 0.001) {
    float tick = floor(uTime * 24.0);
    float band = hash(vec2(floor(uv.y * 26.0), tick));
    uv.x += step(0.74, band) * (band - 0.74) * 0.3 * uGlitch;
  }
  vec2 fromCenter = uv - 0.5;
  float spread = uAberration + uGlitch * 0.01;
  vec3 color = vec3(texture2D(tDiffuse, uv - fromCenter * spread).r, texture2D(tDiffuse, uv).g, texture2D(tDiffuse, uv + fromCenter * spread).b);
  float vignette = smoothstep(1.05, 0.25, length(fromCenter * vec2(1.0, 0.85)));
  color *= mix(0.5, 1.0, vignette);
  color += (hash(uv * uResolution + fract(uTime) * 100.0) - 0.5) * 0.03;
  gl_FragColor = vec4(color, 1.0);
}
`,
};
