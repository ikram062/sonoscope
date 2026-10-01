import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { Check } from "lucide-react";
import { Mark } from "../../components/brand/logo";
import { RadialVisualizer } from "../../components/fx/radial-visualizer";
import { ScopeCorners } from "../../components/fx/scope";
import { Eyebrow, Num, Serif } from "../../components/ui";
import { btn } from "../../lib/styles";
import { genreColor } from "../../lib/sonoscope";
import { bouncy, easeOutExpo, fadeUp, press, spring, stagger } from "../../lib/motion";

export type AnalysisState = {
  genre?: string;
  fileName?: string;
  duration?: number;
  bars?: number[] | null;
};

export default function ProcessingPage() {
  const navigate = useNavigate();
  const rawState = useLocation().state as AnalysisState | null;
  const state = useMemo(() => rawState ?? {}, [rawState]);
  const genre = state.genre ?? "Hip-Hop";
  const [p, setP] = useState(4);

  const smooth = useSpring(4, { stiffness: 60, damping: 20 });
  const width = useTransform(smooth, (v) => `${v}%`);
  useEffect(() => smooth.set(p), [p, smooth]);

  const stages = [
    { at: 0, label: "Separating stems", detail: "Vocals, drums, bass, keys" },
    { at: 30, label: "Mapping repetition", detail: "Finding sections that recur" },
    { at: 60, label: "Scoring loops", detail: "Energy, groove, cleanliness" },
    { at: 85, label: `Matching ${genre}`, detail: "Picking the best fit" },
  ];

  useEffect(() => {
    fetch("/api/analyze", { method: "POST" }).catch(() => {});
    const id = setInterval(() => setP((v) => Math.min(100, v + 3 + Math.random() * 4)), 220);
    return () => clearInterval(id);
  }, []);

  const done = p >= 100;
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate("/result/sonoscope-demo", { replace: true, state }), 1100);
    return () => clearTimeout(t);
  }, [done, navigate, state]);

  const current = stages.findLastIndex((s) => p >= s.at);

  return (
    <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl flex-col items-center justify-center px-5 pb-16 pt-4">
      <motion.div
        variants={{
          hidden: { scale: 0.6, opacity: 0 },
          show: { scale: 1, opacity: 1, transition: { duration: 1.1, ease: easeOutExpo } },
        }}
        className="relative grid place-items-center"
      >
        <div aria-hidden className="absolute size-[420px] bg-[radial-gradient(closest-side,rgba(230,168,255,.22),rgba(159,180,255,.08)_55%,transparent)]" />
        <ScopeCorners inset={-8} size={16} />
        <RadialVisualizer size={340} energy={0.6 + (p / 100) * 0.4} done={done} />
        <div className="absolute grid place-items-center">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.span
                key="done"
                initial={{ scale: 0, rotate: -120 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={bouncy}
                className="grid size-20 place-items-center rounded-full bg-spectrum text-on-accent shadow-[0_0_60px_rgba(230,168,255,.6)]"
              >
                <Check size={34} strokeWidth={2.5} />
              </motion.span>
            ) : (
              <motion.span key="mark" exit={{ scale: 0, opacity: 0, rotate: 90 }} transition={{ duration: 0.25 }}>
                <Mark size={84} animated glow speed={2.6} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.div variants={stagger(0.08, 0.3)} className="mt-6 text-center">
        <motion.div variants={fadeUp} className="flex justify-center">
          <Eyebrow>{done ? "Got it" : "Sonoscope is listening"}</Eyebrow>
        </motion.div>
        <motion.h1 variants={fadeUp} className="mt-5 text-4xl font-semibold tracking-[-.055em] sm:text-6xl">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={String(done)}
              className="inline-block"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
            >
              {done ? (
                <>
                  Your loop is <Serif spectrum>ready.</Serif>
                </>
              ) : (
                <>
                  Finding the <Serif spectrum>pocket</Serif>
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-4 flex items-center justify-center gap-2 truncate text-sm text-paper/45">
          <span className="truncate">{state.fileName ?? "Your track"}</span>
          <span className="size-1 shrink-0 rounded-full bg-paper/25" />
          <span style={{ color: genreColor[genre] }}>{genre}</span>
        </motion.p>
      </motion.div>

      <motion.div
        variants={{
          hidden: { opacity: 0, y: 30, scale: 0.97 },
          show: { opacity: 1, y: 0, scale: 1, transition: { ...spring, delay: 0.5 } },
        }}
        className="glass mt-10 w-full rounded-[28px] bg-ink-2/50 p-5 sm:p-7"
      >
        <div className="flex items-end justify-between gap-4">
          <span className="relative h-5 flex-1 overflow-hidden text-sm text-paper/60">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={done ? "done" : current}
                className="absolute inset-0 truncate"
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -18, opacity: 0 }}
              >
                {done ? "Done — opening your loop" : stages[current].label + "…"}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-3xl font-semibold leading-none tracking-[-.04em] text-paper/90">
            <Num value={Math.floor(p)} suffix="%" />
          </span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.floor(p)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.07]"
        >
          <motion.div
            className="relative h-full overflow-hidden rounded-full bg-spectrum shadow-[0_0_18px_rgba(159,180,255,.8)]"
            style={{ width }}
          >
            <motion.span
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/80 to-transparent"
              animate={{ x: ["-5rem", "48rem"] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </div>

        <motion.ol variants={stagger(0.08, 0.7)} className="mt-7 grid gap-4 sm:grid-cols-4 sm:gap-3">
          {stages.map((s, i) => {
            const isDone = i < current || done;
            const active = i === current && !done;
            return (
              <motion.li
                key={i}
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: spring } }}
                className="flex items-start gap-3 sm:flex-col sm:gap-2.5"
              >
                <motion.span
                  animate={{
                    backgroundColor: isDone ? "#8ef0c9" : "rgba(142,240,201,0)",
                    borderColor: isDone || active ? "#8ef0c9" : "rgba(255,255,255,.15)",
                    scale: active ? [1, 1.12, 1] : 1,
                  }}
                  transition={active ? { scale: { duration: 1, repeat: Infinity } } : spring}
                  className="grid size-6 shrink-0 place-items-center rounded-full border text-on-accent"
                >
                  <AnimatePresence mode="wait">
                    {isDone ? (
                      <motion.span key="c" initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={bouncy}>
                        <Check size={13} strokeWidth={3} />
                      </motion.span>
                    ) : active ? (
                      <motion.span
                        key="a"
                        className="size-2 rounded-full bg-mint"
                        initial={{ scale: 0 }}
                        animate={{ scale: [1, 0.5, 1] }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                    ) : null}
                  </AnimatePresence>
                </motion.span>
                <div>
                  <motion.p
                    animate={{ color: isDone || active ? "rgba(244,241,234,.92)" : "rgba(244,241,234,.35)" }}
                    className="text-sm"
                  >
                    {s.label}
                  </motion.p>
                  <p className="mt-0.5 text-xs text-paper/30">{s.detail}</p>
                </div>
              </motion.li>
            );
          })}
        </motion.ol>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 1 } } }}
        className="mt-6 flex justify-center"
      >
        <motion.button {...press} type="button" onClick={() => navigate("/upload")} className={btn.ghost}>
          Cancel
        </motion.button>
      </motion.div>
    </section>
  );
}
