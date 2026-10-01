import { useEffect, useRef } from "react";

const STOPS = [
  [142, 240, 201],
  [159, 180, 255],
  [230, 168, 255],
  [255, 194, 154],
  [142, 240, 201],
];

function spectrumAt(t: number) {
  const x = (((t % 1) + 1) % 1) * (STOPS.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const [a, b] = [STOPS[i], STOPS[i + 1]];
  return a.map((v, k) => Math.round(v + (b[k] - v) * f));
}

/**
 * A circular spectrum analyser drawn on canvas. The "audio" is synthetic:
 * layered sines whose energy follows `energy` (0–1). When `done` is set the
 * bars settle into a calm, even ring.
 */
export function RadialVisualizer({
  size = 360,
  energy = 1,
  done = false,
}: {
  size?: number;
  energy?: number;
  done?: boolean;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const props = useRef({ energy, done });
  useEffect(() => {
    props.current = { energy, done };
  }, [energy, done]);

  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    c.width = size * dpr;
    c.height = size * dpr;
    ctx.scale(dpr, dpr);

    const N = 132;
    const levels = new Float32Array(N);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;
    let calm = 0;
    let last = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reduce) t += dt;
      calm += ((props.current.done ? 1 : 0) - calm) * (1 - Math.exp(-dt * 4));
      const e = props.current.energy * (1 - calm);

      const cx = size / 2;
      const r = size * 0.27;
      ctx.clearRect(0, 0, size, size);

      // Faint guide rings.
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath();
        ctx.arc(cx, cx, r + k * size * 0.055, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${0.05 - k * 0.012})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.6, (Math.PI * 2 * r) / N - 3.2);
      const spin = t * 0.12;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        // Mirror the signal so the ring looks symmetrical, like a real analyser.
        const u = Math.min(i, N - i) / (N / 2);
        const target =
          0.15 +
          e *
            (0.45 * Math.abs(Math.sin(u * 9 + t * 3.1)) * Math.abs(Math.sin(u * 3.3 - t * 1.7)) +
              0.3 * Math.max(0, Math.sin(t * 6.2 + u * 2)) ** 6 +
              0.18 * Math.abs(Math.sin(u * 23 + t * 9)));
        levels[i] += (target * (1 - calm) + 0.22 * calm - levels[i]) * Math.min(1, dt * 14);
        const len = levels[i] * size * 0.16;
        const ang = a + spin - Math.PI / 2;
        const [R, G, B] = spectrumAt(i / N + t * 0.03);
        ctx.strokeStyle = `rgba(${R},${G},${B},${0.55 + levels[i] * 0.45})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * r, cx + Math.sin(ang) * r);
        ctx.lineTo(cx + Math.cos(ang) * (r + len), cx + Math.sin(ang) * (r + len));
        ctx.stroke();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={canvas}
      aria-hidden
      style={{ width: size, maxWidth: "100%", height: "auto", aspectRatio: "1 / 1" }}
    />
  );
}
