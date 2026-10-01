import { motion, type Transition, type Variants } from "motion/react";
import { Link } from "react-router-dom";

/** A react-router Link with motion props (whileHover, variants, …). */
export const MotionLink = motion.create(Link);

export const spring: Transition = { type: "spring", stiffness: 380, damping: 30 };
export const softSpring: Transition = { type: "spring", stiffness: 170, damping: 24 };
export const bouncy: Transition = { type: "spring", stiffness: 500, damping: 18 };
export const easeOutExpo = [0.16, 1, 0.3, 1] as const;

/** Route-level wrapper. Its variant labels propagate to every child using `variants`. */
export const page: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] },
  },
};

export const stagger = (gap = 0.06, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
});

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: bouncy },
};

/** Hover/tap feedback for buttons and cards. */
export const press = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.96, y: 0 },
  transition: spring,
} as const;

export const lift = {
  whileHover: { y: -4, transition: spring },
  whileTap: { scale: 0.98 },
} as const;
