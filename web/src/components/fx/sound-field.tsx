import { useEffect, useRef } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";

/**
 * Full-screen WebGL backdrop: aurora curtains plus a bundle of glowing
 * oscilloscope traces that bend toward the cursor. In the spirit of React Bits'
 * Aurora / Threads, written for sonoscope's palette.
 *
 * `intensity` and `speed` ease toward new values, so routes can turn the field
 * up (processing) or down (dense pages) without a visible jump.
 */

const vertex = /* glsl */ `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uIntensity;
uniform float uFocus;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

vec3 spectrum(float t) {
  vec3 a = vec3(0.557, 0.941, 0.788);
  vec3 b = vec3(0.624, 0.706, 1.000);
  vec3 c = vec3(0.902, 0.659, 1.000);
  vec3 d = vec3(1.000, 0.761, 0.604);
  t = clamp(t, 0.0, 1.0) * 3.0;
  if (t < 1.0) return mix(a, b, t);
  if (t < 2.0) return mix(b, c, t - 1.0);
  return mix(c, d, t - 2.0);
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float aspect = uRes.x / uRes.y;
  float t = uTime;
  vec3 col = vec3(0.027, 0.027, 0.039);

  // Aurora curtains drifting across the top of the viewport.
  float n1 = snoise(vec2(p.x * 0.9 + t * 0.045, t * 0.03));
  float n2 = snoise(vec2(p.x * 2.1 - t * 0.06, 4.0 + t * 0.05));
  float h = 0.36 + 0.10 * n1 + 0.04 * n2;
  float band = exp(-pow((p.y - h) * 2.6, 2.0));
  float rays = 0.75 + 0.25 * snoise(vec2(p.x * 2.6 + n1 * 0.6, t * 0.06));
  vec3 aur = spectrum(0.5 + 0.5 * sin(p.x * 1.1 + t * 0.07 + n1 * 1.4));
  col += aur * band * rays * 0.20 * uIntensity;

  // A faint warm horizon at the bottom.
  col += spectrum(0.9) * exp(-pow((p.y + 0.62) * 2.2, 2.0)) * 0.05 * uIntensity;

  // Oscilloscope traces.
  vec2 m = (uMouse - 0.5) * vec2(aspect, 1.0);
  float env = exp(-pow(p.x * 0.85, 2.0));
  float pull = exp(-pow((p.x - m.x) * 2.2, 2.0)) * clamp(m.y - uFocus, -0.3, 0.3) * 0.55;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float freq = 3.2 + fi * 1.15;
    float amp = (0.05 + 0.022 * fi) * (0.7 + 0.3 * sin(t * 0.35 + fi * 1.3));
    float y = uFocus + (fi - 2.5) * 0.009
      + env * amp * sin(p.x * freq + t * (0.55 + fi * 0.12) + fi * 1.9)
      + env * pull * (0.6 + fi * 0.08);
    float d = abs(p.y - y);
    float line = smoothstep(0.0035, 0.0, d) * 0.55 + 0.0022 / (d + 0.004);
    vec3 c = spectrum(p.x / aspect + 0.5 + (fi - 2.5) * 0.04);
    col += c * line * 0.11 * uIntensity * (0.25 + 0.75 * env);
  }

  // Vignette, then film grain (doubles as dither against banding).
  float vig = smoothstep(1.25, 0.15, length(p * vec2(0.85, 1.15)));
  col *= mix(0.45, 1.0, vig);
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.028;
  gl_FragColor = vec4(col, 1.0);
}
`;

type Props = {
  intensity?: number;
  speed?: number;
  /** Vertical centre of the traces, -0.5 (bottom) … 0.5 (top). */
  focus?: number;
};

export function SoundField({ intensity = 1, speed = 1, focus = 0 }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const target = useRef({ intensity, speed, focus });

  useEffect(() => {
    target.current = { intensity, speed, focus };
  }, [intensity, speed, focus]);

  useEffect(() => {
    const el = host.current;
    if (!el) return;

    // The field is all soft light, so it is drawn below screen resolution and
    // upscaled by CSS. If frames still run long, quality drops a step.
    let scale = 0.75;
    let renderer: Renderer;
    try {
      renderer = new Renderer({ dpr: scale, alpha: false, antialias: false, powerPreference: "low-power" });
    } catch {
      return; // No WebGL: the CSS backdrop behind the canvas still shows.
    }
    const gl = renderer.gl;
    gl.clearColor(0.027, 0.027, 0.039, 1);
    gl.canvas.style.width = "100%";
    gl.canvas.style.height = "100%";
    el.appendChild(gl.canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uRes: { value: [1, 1] },
        uMouse: { value: [0.5, 0.5] },
        uIntensity: { value: 0 },
        uFocus: { value: target.current.focus },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      renderer.dpr = scale;
      renderer.setSize(window.innerWidth, window.innerHeight);
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      program.uniforms.uRes.value = [gl.drawingBufferWidth, gl.drawingBufferHeight];
    };
    resize();
    window.addEventListener("resize", resize);

    const mouse = { x: 0.5, y: 0.5 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / window.innerWidth;
      mouse.y = 1 - e.clientY / window.innerHeight;
    };
    window.addEventListener("pointermove", onMove);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let time = 8; // start mid-drift so the first frame already looks composed
    let speedNow = target.current.speed;
    let slowFrames = 0;
    let sampled = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.hidden) return;

      // Adaptive quality: if most of the first ~2s of frames miss 50fps, step down once.
      if (scale > 0.5 && sampled < 120) {
        sampled++;
        if (dt > 1 / 50) slowFrames++;
        if (sampled === 120 && slowFrames > 40) {
          scale = 0.5;
          resize();
        }
      }

      const u = program.uniforms;
      const k = 1 - Math.exp(-dt * 2.2);
      speedNow += (target.current.speed - speedNow) * k;
      u.uIntensity.value += (target.current.intensity - u.uIntensity.value) * k;
      u.uFocus.value += (target.current.focus - u.uFocus.value) * k;
      const [mx, my] = u.uMouse.value as number[];
      u.uMouse.value = [mx + (mouse.x - mx) * k * 1.5, my + (mouse.y - my) * k * 1.5];
      if (!reduce) time += dt * speedNow;
      u.uTime.value = time;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      gl.canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden
      className="pointer-events-none fixed inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,#1a1630,transparent),radial-gradient(60%_50%_at_80%_100%,#2a1a24,transparent)]"
    />
  );
}
