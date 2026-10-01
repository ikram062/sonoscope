import { type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow, { type Format } from "@number-flow/react";
import { Check, Drum, Guitar, Mic2, Music2, Pause, Piano, Play } from "lucide-react";
import { bouncy, spring } from "../lib/motion";

/* ---------- Typography ---------- */

export function Eyebrow({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <p className="flex items-center gap-2.5 font-mono text-[11px] font-medium uppercase tracking-[.22em] text-paper/55">
      {icon ?? <span className="h-px w-6 bg-spectrum" />}
      {children}
    </p>
  );
}

/** Instrument Serif italic accent, optionally painted with the spectrum. */
export function Serif({ children, spectrum = false }: { children: ReactNode; spectrum?: boolean }) {
  return (
    <span
      className={`font-serif font-normal italic tracking-[-.02em] ${spectrum ? "text-spectrum pr-[.08em]" : ""}`}
    >
      {children}
    </span>
  );
}

export function IconFor({ stem, size = 16 }: { stem: string; size?: number }) {
  const Icon =
    stem === "Vocals"
      ? Mic2
      : stem === "Drums"
        ? Drum
        : stem === "Guitar"
          ? Guitar
          : stem === "Piano"
            ? Piano
            : Music2;
  return <Icon size={size} />;
}

/* ---------- Numbers ---------- */

/** Rolling-digit number (NumberFlow) in the mono face. */
export function Num({
  value,
  format,
  suffix,
  prefix,
  className = "",
}: {
  value: number;
  format?: Format;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  return (
    <NumberFlow
      value={value}
      format={format}
      suffix={suffix}
      prefix={prefix}
      className={`font-mono tabular-nums ${className}`}
      willChange
    />
  );
}

/* ---------- Playback ---------- */

/** Small animated equaliser used for "playing" / "listening" indicators. */
export function EqBars({
  className = "",
  count = 4,
  barClassName = "w-[3px]",
}: {
  className?: string;
  count?: number;
  barClassName?: string;
}) {
  return (
    <span aria-hidden className={`flex h-3.5 items-end gap-[2px] ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i}
          className={`h-full origin-bottom rounded-full bg-current ${barClassName}`}
          animate={{ scaleY: [0.3, 1, 0.45, 0.85, 0.3] }}
          transition={{
            duration: 1.1 + (i % 3) * 0.15,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.12,
          }}
        />
      ))}
    </span>
  );
}

/** Round play/pause button. While playing, a spectrum ring spins around it. */
export function PlayButton({
  playing,
  onClick,
  size = 48,
  label,
  color,
  disabled,
}: {
  playing: boolean;
  onClick: () => void;
  size?: number;
  label: string;
  /** Solid colour instead of paper (e.g. a library item's hue). */
  color?: string;
  disabled?: boolean;
}) {
  const icon = Math.round(size * 0.38);
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.9 }}
      transition={spring}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="relative z-10 grid shrink-0 place-items-center rounded-full disabled:opacity-40"
      style={{ width: size, height: size }}
    >
      <AnimatePresence>
        {playing && (
          <motion.span
            aria-hidden
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              rotate: { duration: 3, repeat: Infinity, ease: "linear" },
              default: { duration: 0.3 },
            }}
            className="absolute -inset-[3px] rounded-full"
            style={{
              background:
                "conic-gradient(from 0deg, #8ef0c9, #9fb4ff, #e6a8ff, #ffc29a, #8ef0c9)",
            }}
          />
        )}
      </AnimatePresence>
      {playing && (
        <motion.span
          aria-hidden
          className="absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgba(230,168,255,.55),transparent)]"
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
      )}
      <span
        className="relative grid size-full place-items-center rounded-full text-on-accent shadow-[inset_0_-2px_0_rgba(0,0,0,.15)]"
        style={{ background: color ?? "#f4f1ea" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={String(playing)}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 90 }}
            transition={{ duration: 0.15 }}
            className="inline-flex"
          >
            {playing ? (
              <Pause size={icon} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play size={icon} fill="currentColor" strokeWidth={0} className="ml-[8%]" />
            )}
          </motion.span>
        </AnimatePresence>
      </span>
    </motion.button>
  );
}

/* ---------- Portaled bars & toasts (escape the page's transform) ---------- */

/**
 * Floating glass dock at the bottom of the viewport. Rendered in a portal so
 * page transforms don't break `position: fixed`, but it still inherits the
 * page's hidden/show/exit variants.
 */
export function ActionBar({ children, width = "max-w-3xl" }: { children: ReactNode; width?: string }) {
  return createPortal(
    <motion.div
      variants={{
        hidden: { y: "160%", opacity: 0 },
        show: { y: "0%", opacity: 1, transition: { ...spring, delay: 0.3 } },
        exit: { y: "160%", opacity: 0, transition: { duration: 0.2 } },
      }}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className={`pointer-events-auto glass frost mx-auto rounded-[26px] ${width}`}>
        {children}
      </div>
    </motion.div>,
    document.body,
  );
}

export function Toast({ message }: { message: string | null }) {
  return createPortal(
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          initial={{ opacity: 0, y: -30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.9 }}
          transition={bouncy}
          className="glass ring-spectrum fixed inset-x-0 top-5 z-[70] mx-auto flex w-fit items-center gap-2.5 rounded-full bg-ink-3/80 py-2 pl-2 pr-4 text-sm"
        >
          <motion.span
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...bouncy, delay: 0.1 }}
            className="grid size-6 place-items-center rounded-full bg-spectrum text-on-accent"
          >
            <Check size={13} strokeWidth={3} />
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
