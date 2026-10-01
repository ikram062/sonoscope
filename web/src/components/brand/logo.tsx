import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimationFrame, useInView, useReducedMotion } from "motion/react";
import { palette } from "../../lib/sonoscope";

/**
 * The sonoscope mark: a scope reticle (a ring broken at the four cardinal
 * points) with a sound-wave packet passing through its centre.
 */

const R = 19;
const CIRC = 2 * Math.PI * R;
const GAP = 4.6;
const DASH = CIRC / 4 - GAP;

/** Gaussian-enveloped sine, i.e. a single "packet" of sound. */
function wavePath(phase = 0, amp = 9.5) {
  const pts: string[] = [];
  for (let x = 9; x <= 39; x += 0.75) {
    const u = x - 24;
    const y = 24 - amp * Math.exp(-((u / 6.6) ** 2)) * Math.sin(u * 0.86 + phase);
    pts.push(`${pts.length ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join("");
}

const STATIC_WAVE = wavePath(0);

type MarkProps = {
  size?: number;
  /** Let the wave travel. Respects prefers-reduced-motion. */
  animated?: boolean;
  /** Speed multiplier for the travelling wave. */
  speed?: number;
  glow?: boolean;
  className?: string;
};

export function Mark({ size = 32, animated = false, speed = 1, glow = false, className }: MarkProps) {
  const id = useId().replace(/:/g, "");
  const svg = useRef<SVGSVGElement>(null);
  const onScreen = useInView(svg);
  const wave = useRef<SVGPathElement>(null);
  const halo = useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  const phase = useRef(0);

  useAnimationFrame((_, delta) => {
    if (!animated || reduce || !onScreen) return;
    phase.current -= (delta / 1000) * 2.4 * speedRef.current;
    const d = wavePath(phase.current, 9.5 * (0.85 + 0.15 * Math.sin(phase.current * 0.5)));
    wave.current?.setAttribute("d", d);
    halo.current?.setAttribute("d", d);
  });

  return (
    <svg
      ref={svg}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={className}
      overflow="visible"
    >
      <defs>
        <linearGradient id={`${id}-g`} x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette.mint} />
          <stop offset=".38" stopColor={palette.iris} />
          <stop offset=".7" stopColor={palette.orchid} />
          <stop offset="1" stopColor={palette.peach} />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>
      {glow && (
        <path
          ref={halo}
          d={STATIC_WAVE}
          stroke={`url(#${id}-g)`}
          strokeWidth="4"
          strokeLinecap="round"
          filter={`url(#${id}-blur)`}
          opacity=".85"
        />
      )}
      <circle
        cx="24"
        cy="24"
        r={R}
        stroke={`url(#${id}-g)`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray={`${DASH} ${GAP}`}
        strokeDashoffset={DASH + GAP / 2}
        transform="rotate(-45 24 24)"
      />
      <path
        ref={wave}
        d={STATIC_WAVE}
        stroke={`url(#${id}-g)`}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="1.6" fill={palette.paper} opacity=".9" />
    </svg>
  );
}

/** Mark + wordmark, linking home. */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" aria-label="sonoscope home" className="group flex items-center gap-2.5">
      <motion.span
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="inline-flex"
      >
        <Mark size={30} animated speed={0.6} />
      </motion.span>
      {!compact && (
        <span className="text-[17px] font-semibold tracking-[-.045em] text-paper">
          sonoscope
        </span>
      )}
    </Link>
  );
}
