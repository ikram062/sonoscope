import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import { alpha, fallbackWave, formatTime, SPECTRUM, spectrumGradient } from "../lib/sonoscope";
import { bouncy, spring, stagger } from "../lib/motion";

type WaveformProps = {
  /** Loop start/end as a percentage of the track. */
  start?: number;
  end?: number;
  bars?: number[];
  /** Track length in seconds, used for time labels. */
  duration?: number;
  /** Playhead position as a percentage, or null to hide it. */
  playhead?: number | null;
  editable?: boolean;
  compact?: boolean;
  /** A hex colour, or `SPECTRUM` to paint the region with the full gradient. */
  color?: string;
  minLength?: number;
  /** Draw the surrounding glass panel. */
  framed?: boolean;
  onChange?: (start: number, end: number) => void;
  onSeek?: (pct: number) => void;
};

export function Waveform({
  start = 30,
  end = 66,
  bars = fallbackWave,
  duration = 272,
  playhead = null,
  editable = false,
  compact = false,
  color = SPECTRUM,
  minLength = 4,
  framed = true,
  onChange,
  onSeek,
}: WaveformProps) {
  const track = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"start" | "end" | null>(null);
  const regionTransition = dragging ? { duration: 0 } : spring;
  const isSpectrum = color === SPECTRUM;
  const n = bars.length;

  const regionFill = isSpectrum
    ? "linear-gradient(90deg, rgba(142,240,201,.12), rgba(159,180,255,.10), rgba(230,168,255,.10), rgba(255,194,154,.12))"
    : `linear-gradient(180deg, ${alpha(color, 0.14)}, ${alpha(color, 0.05)})`;
  const edge = isSpectrum ? "rgba(255,255,255,.16)" : alpha(color, 0.35);
  const solid = isSpectrum ? "#f4f1ea" : color;

  // The spectrum is stretched across the loop region (not the whole track), so
  // every loop shows the full gradient. Each bar paints its own slice of it.
  const centre = (i: number) => ((i + 0.5) / n) * 100;
  const first = bars.findIndex((_, i) => centre(i) >= start);
  const count = Math.max(1, bars.filter((_, i) => centre(i) >= start && centre(i) <= end).length);
  const barPaint = (i: number): CSSProperties =>
    isSpectrum
      ? {
          backgroundImage: spectrumGradient,
          backgroundSize: `${count * 100}% 100%`,
          backgroundPosition: `${((i - first) / Math.max(1, count - 1)) * 100}% 0`,
        }
      : { background: color };

  const pctFromEvent = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100));
  };
  const move = (which: "start" | "end", pct: number) => {
    if (which === "start") onChange?.(Math.min(pct, end - minLength), end);
    else onChange?.(start, Math.max(pct, start + minLength));
  };
  const handleProps = (which: "start" | "end") => ({
    role: "slider",
    tabIndex: 0,
    "aria-label": which === "start" ? "Loop start" : "Loop end",
    "aria-valuemin": 0,
    "aria-valuemax": 100,
    "aria-valuenow": Math.round(which === "start" ? start : end),
    "aria-valuetext": formatTime(((which === "start" ? start : end) / 100) * duration),
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setDragging(which);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (dragging === which) move(which, pctFromEvent(e.clientX));
    },
    onPointerUp: () => setDragging(null),
    // Releasing a handle shouldn't also seek the playhead.
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1;
      const cur = which === "start" ? start : end;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault();
        move(which, Math.max(0, cur - step));
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault();
        move(which, Math.min(100, cur + step));
      }
    },
  });

  return (
    <div
      className={`relative select-none ${framed ? `glass rounded-[22px] ${compact ? "p-3" : "p-5 sm:p-8"}` : ""}`}
    >
      <div
        ref={track}
        onClick={(e) => onSeek?.(pctFromEvent(e.clientX))}
        className={`relative ${onSeek ? "cursor-pointer" : ""}`}
      >
        {/* Loop region: a soft glow underneath and a tinted window on top. */}
        <motion.div
          aria-hidden
          className="absolute inset-y-0 rounded-xl opacity-40 blur-2xl"
          initial={false}
          animate={{ left: `${start}%`, width: `${end - start}%` }}
          transition={regionTransition}
          style={{ background: isSpectrum ? spectrumGradient : color }}
        />
        <motion.div
          className={`absolute ${compact ? "inset-y-[-4px] rounded-lg" : "inset-y-[-10px] rounded-xl"}`}
          initial={false}
          animate={{ left: `${start}%`, width: `${end - start}%` }}
          transition={regionTransition}
          style={{ background: regionFill, boxShadow: `inset 0 0 0 1px ${edge}` }}
        />

        <motion.div
          initial="hidden"
          animate="show"
          variants={stagger(0.45 / n)}
          className={`relative flex items-center gap-[2px] sm:gap-[3px] ${compact ? "h-14" : "h-32 sm:h-40"}`}
        >
          {bars.map((h, i) => {
            const p = centre(i);
            const active = p >= start && p <= end;
            const dimmed = active && playhead != null && p > playhead;
            return (
              <motion.span
                key={i}
                variants={{
                  hidden: { scaleY: 0.04, opacity: 0 },
                  show: {
                    scaleY: 1,
                    opacity: 1,
                    transition: { type: "spring", stiffness: 220, damping: 16 },
                  },
                }}
                className="w-full rounded-full"
                style={{
                  height: `${h}%`,
                  ...(active ? barPaint(i) : { background: "rgba(244,241,234,.16)" }),
                  // filter, not opacity: opacity is owned by the entrance animation.
                  filter: dimmed ? "opacity(.38)" : "none",
                  transition: "filter .25s",
                }}
              />
            );
          })}
        </motion.div>

        <AnimatePresence>
          {playhead != null && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              exit={{ opacity: 0, scaleY: 0 }}
              className={`pointer-events-none absolute w-[2px] -translate-x-1/2 rounded-full bg-paper shadow-[0_0_14px_2px_rgba(255,255,255,.6)] ${compact ? "inset-y-[-6px]" : "inset-y-[-16px]"}`}
              style={{ left: `${playhead}%` }}
            >
              {!compact && (
                <span className="absolute -top-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-paper" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editable &&
            (["start", "end"] as const).map((which, i) => {
              const at = which === "start" ? start : end;
              return (
                <motion.div
                  key={which}
                  {...handleProps(which)}
                  initial={{ opacity: 0, scale: 0.3, left: `${at}%` }}
                  animate={{ opacity: 1, scale: 1, left: `${at}%` }}
                  exit={{ opacity: 0, scale: 0.3 }}
                  transition={{ default: { ...bouncy, delay: i * 0.06 }, left: regionTransition }}
                  className="group/handle absolute inset-y-[-22px] z-10 w-8 -translate-x-1/2 cursor-ew-resize touch-none outline-none"
                >
                  <span
                    className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full"
                    style={{ background: solid, boxShadow: `0 0 16px ${alpha(solid, 0.7)}` }}
                  />
                  <motion.span
                    animate={{ scale: dragging === which ? 1.15 : 1 }}
                    transition={spring}
                    className="absolute left-1/2 top-1/2 grid h-10 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-[0_6px_20px_rgba(0,0,0,.5)] ring-4 ring-transparent transition-shadow group-hover/handle:ring-white/15 group-focus-visible/handle:ring-white/40"
                    style={{ background: solid }}
                  >
                    <span className="flex gap-[2px]">
                      <span className="h-3.5 w-px bg-on-accent/50" />
                      <span className="h-3.5 w-px bg-on-accent/50" />
                    </span>
                  </motion.span>
                  <motion.span
                    animate={{ opacity: dragging === which ? 1 : 0.75, y: dragging === which ? -4 : 0 }}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md border border-white/10 bg-ink-3/90 px-1.5 py-0.5 font-mono text-[10px] text-paper/85"
                  >
                    {formatTime((at / 100) * duration)}
                  </motion.span>
                </motion.div>
              );
            })}
        </AnimatePresence>
      </div>

      {!compact && (
        <div className="mt-6 flex items-center justify-between font-mono text-[10px] tracking-[.18em] text-paper/30">
          <span>00:00</span>
          <span className="flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.03] px-2.5 py-1 text-paper/70">
            <span className="size-1.5 rounded-full" style={{ background: isSpectrum ? spectrumGradient : color }} />
            {formatTime((start / 100) * duration)} — {formatTime((end / 100) * duration)}
          </span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  );
}
