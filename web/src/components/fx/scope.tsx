import { useEffect, useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

/**
 * The "scope" language: instrument-panel details that make sonoscope feel like
 * an oscilloscope rather than a web page. Everything here animates transforms
 * and opacity only, so it stays on the compositor.
 */

/** Four reticle brackets pinned to the corners of the nearest positioned parent. */
export function ScopeCorners({ inset = 10, size = 12 }: { inset?: number; size?: number }) {
  const corners = [
    "left-0 top-0 border-l border-t",
    "right-0 top-0 border-r border-t",
    "bottom-0 left-0 border-b border-l",
    "bottom-0 right-0 border-b border-r",
  ];
  return (
    <span aria-hidden className="pointer-events-none absolute" style={{ inset }}>
      {corners.map((c) => (
        <span key={c} className={`absolute border-paper/25 ${c}`} style={{ width: size, height: size }} />
      ))}
    </span>
  );
}

const INTERACTIVE =
  "a,button,[role=button],[role=radio],[role=slider],[role=menuitem],input,label,select,textarea,[data-cursor]";

/**
 * A reticle that trails the pointer, matching the logo's broken ring. It opens
 * up over anything clickable and pinches on press. Mouse-only; hidden for
 * touch and reduced motion. The native cursor stays, so input never feels laggy.
 */
export function ScopeCursor() {
  const reduce = useReducedMotion();
  const [enabled] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches,
  );
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 900, damping: 60, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 900, damping: 60, mass: 0.35 });
  const [hover, setHover] = useState(false);
  const [down, setDown] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled || reduce) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHover(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
    };
    const leave = () => setVisible(false);
    const press = () => setDown(true);
    const release = () => setDown(false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", press);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
    };
  }, [enabled, reduce, x, y]);

  if (!enabled || reduce) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[90]"
      style={{ x: sx, y: sy }}
    >
      <motion.svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        className="-ml-[22px] -mt-[22px]"
        animate={{
          scale: down ? 0.7 : hover ? 1.25 : 0.62,
          rotate: hover ? 45 : 0,
          opacity: visible ? (hover ? 0.95 : 0.5) : 0,
        }}
        transition={{ type: "spring", stiffness: 420, damping: 28 }}
      >
        <circle
          cx="22"
          cy="22"
          r="17"
          fill="none"
          stroke="#f4f1ea"
          strokeWidth="1.2"
          strokeDasharray="22.7 4"
          strokeDashoffset="24.7"
          transform="rotate(-45 22 22)"
        />
      </motion.svg>
    </motion.div>
  );
}

/** A phosphor beam that sweeps down the screen when the route changes. */
export function RouteScan({ id }: { id: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      key={id}
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[85] h-px"
      initial={{ y: "0vh", opacity: 0 }}
      animate={{ y: "100vh", opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.85, ease: [0.65, 0, 0.35, 1], times: [0, 0.1, 0.8, 1] }}
    >
      <div className="h-px w-full bg-spectrum shadow-[0_0_18px_2px_rgba(159,180,255,.6)]" />
      <div className="h-24 w-full -translate-y-full bg-gradient-to-t from-iris/[.07] to-transparent" />
    </motion.div>
  );
}
