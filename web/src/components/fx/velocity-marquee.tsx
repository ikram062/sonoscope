import { useRef, type ReactNode } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  wrap,
} from "motion/react";

/**
 * React Bits-style ScrollVelocity: an endless marquee that drifts on its own
 * and speeds up (or reverses) with the page's scroll velocity.
 */
export function VelocityMarquee({
  children,
  baseVelocity = 2,
  className = "",
}: {
  children: ReactNode;
  /** Percent of one copy's width per second. Negative runs right-to-left. */
  baseVelocity?: number;
  className?: string;
}) {
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const factor = useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const x = useTransform(base, (v) => `${wrap(-25, -50, v)}%`);
  const direction = useRef(1);
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const onScreen = useInView(box);

  useAnimationFrame((_, delta) => {
    if (reduce || !onScreen) return;
    let move = direction.current * baseVelocity * (delta / 1000);
    const f = factor.get();
    if (f < 0) direction.current = -1;
    else if (f > 0) direction.current = 1;
    move += direction.current * move * f;
    base.set(base.get() + move);
  });

  return (
    <div ref={box} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <motion.div className="flex w-max flex-nowrap" style={{ x }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} aria-hidden={i > 0} className="flex shrink-0 items-center">
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
