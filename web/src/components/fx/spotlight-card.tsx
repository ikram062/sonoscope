import { useRef, type CSSProperties, type ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform, type HTMLMotionProps } from "motion/react";

type Props = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  /** Colour of the cursor-following spotlight. */
  glow?: string;
  /** Max tilt in degrees; 0 disables the 3D tilt. */
  tilt?: number;
};

/**
 * React Bits-style SpotlightCard with an optional 3D tilt: a soft light follows
 * the cursor across the surface and the card leans toward it.
 */
export function SpotlightCard({
  children,
  glow = "rgba(255,255,255,.10)",
  tilt = 0,
  className = "",
  style,
  ...rest
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const spring = { stiffness: 160, damping: 18 };
  const rotateY = useSpring(useTransform(mx, [0, 1], [-tilt, tilt]), spring);
  const rotateX = useSpring(useTransform(my, [0, 1], [tilt, -tilt]), spring);
  const light = useTransform(
    [mx, my],
    ([x, y]) =>
      `radial-gradient(520px circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${glow}, transparent 45%)`,
  );
  const opacity = useSpring(0, { stiffness: 200, damping: 30 });

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width);
        my.set((e.clientY - r.top) / r.height);
        opacity.set(1);
      }}
      onPointerLeave={() => {
        mx.set(0.5);
        my.set(0.5);
        opacity.set(0);
      }}
      style={{
        ...(tilt ? { rotateX, rotateY, transformPerspective: 900 } : null),
        ...(style as CSSProperties),
      }}
      className={`relative ${className}`}
      {...rest}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
        style={{ background: light, opacity }}
      />
      {children}
    </motion.div>
  );
}
