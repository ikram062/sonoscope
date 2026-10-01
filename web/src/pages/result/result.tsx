import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Repeat,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Waveform } from "../../components/waveform";
import {
  ActionBar,
  EqBars,
  Eyebrow,
  IconFor,
  Num,
  PlayButton,
  Serif,
  Toast,
} from "../../components/ui";
import { btn } from "../../lib/styles";
import {
  alpha,
  demoWave,
  fakeLibrary,
  fallbackWave,
  formatTime,
  genreColor,
  genres,
  SPECTRUM,
  stemColor,
  stems,
} from "../../lib/sonoscope";
import { bouncy, easeOutExpo, fadeUp, press, spring, stagger } from "../../lib/motion";
import type { AnalysisState } from "../processing/processing";

type ResultState = AnalysisState & { start?: number; end?: number };

const reasons: Record<string, string> = {
  "Hip-Hop": "a clean, isolated drum pattern with a satisfying swing",
  "R&B": "lush chord voicings with space left for a vocal",
  "Lo-Fi": "warm keys and texture that loop without an obvious seam",
  Pop: "the catchiest melodic hook in the track",
  Electronic: "a driving synth riff that locks tightly to the grid",
  Other: "the most repeatable, self-contained pocket in the track",
};

const swap = {
  initial: { opacity: 0, y: 14, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, y: -14, filter: "blur(6px)" },
  transition: { duration: 0.35, ease: easeOutExpo },
};

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3 }}
      className="glass rounded-[20px] bg-ink-2/40 px-5 py-4"
    >
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-paper/35">{label}</p>
      <div className="mt-2 text-xl font-semibold tracking-[-.03em] text-paper/90">{children}</div>
    </motion.div>
  );
}

function NudgeButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <Tooltip title={label}>
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.85 }}
        aria-label={label}
        onClick={onClick}
        className="grid size-8 place-items-center rounded-full bg-white/[.05] text-paper/60 transition-colors hover:bg-white/10 hover:text-paper"
      >
        {children}
      </motion.button>
    </Tooltip>
  );
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { pathname, state: rawState } = useLocation();
  const state = (rawState ?? {}) as ResultState;
  const edit = pathname.endsWith("/edit");
  const basePath = pathname.replace(/\/edit$/, "");
  const id = pathname.split("/")[2] ?? "sonoscope-demo";
  const saved = fakeLibrary.find((x) => x.id === id);
  const libIndex = saved ? fakeLibrary.indexOf(saved) : 0;

  const track = useMemo(() => {
    const duration = saved?.duration ?? (state.duration || 272);
    return {
      title: saved?.title ?? state.fileName ?? "midnight-drive.wav",
      duration,
      bars: saved ? demoWave(libIndex + 3) : state.bars?.length ? state.bars : fallbackWave,
      bpm: saved?.bpm ?? 92,
      musicalKey: saved?.musicalKey ?? "F minor",
      aiStart: saved ? (saved.start / duration) * 100 : 30,
      // Demo pick: 16 bars at 92 BPM.
      aiEnd: saved
        ? (saved.end / duration) * 100
        : Math.min(100, 30 + ((16 * 4 * 60) / 92 / duration) * 100),
      color: saved?.color ?? SPECTRUM,
    };
  }, [saved, libIndex, state.duration, state.fileName, state.bars]);

  const [genre, setGenre] = useState(saved?.genre ?? state.genre ?? "Hip-Hop");
  const [start, setStart] = useState(state.start ?? track.aiStart);
  const [end, setEnd] = useState(state.end ?? track.aiEnd);
  const [snapshot, setSnapshot] = useState<[number, number] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState<string[]>(["Vocals"]);
  const [solo, setSolo] = useState<string | null>(null);
  const [vol, setVol] = useState<Record<string, number>>({
    Vocals: 70,
    Drums: 86,
    Bass: 78,
    Guitar: 58,
    Piano: 46,
    Other: 32,
  });

  // Simulated playback that loops inside the selected region.
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setPos((p) => {
        const next = (p ?? start) + 0.25;
        return next > end || next < start ? start : next;
      });
    }, 40);
    return () => clearInterval(id);
  }, [playing, start, end]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.code === "Space" && !el.closest("input,button,[role=slider]")) {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const loopSeconds = ((end - start) / 100) * track.duration;
  const barsCount = Math.max(1, Math.round((loopSeconds * track.bpm) / 60 / 4));
  const modified = Math.abs(start - track.aiStart) > 0.5 || Math.abs(end - track.aiEnd) > 0.5;
  const audible = (s: string) => (solo ? solo === s : !muted.includes(s));
  const barPct = ((4 * 60) / track.bpm / track.duration) * 100;
  const nudge = (which: "start" | "end", d: number) =>
    which === "start"
      ? setStart((s) => Math.max(0, Math.min(end - barPct, s + d)))
      : setEnd((e) => Math.min(100, Math.max(start + barPct, e + d)));

  const enterEdit = () => {
    setSnapshot([start, end]);
    navigate(`${basePath}/edit`, { state: { ...state, start, end } });
  };
  const leaveEdit = (keep: boolean) => {
    if (!keep && snapshot) {
      setStart(snapshot[0]);
      setEnd(snapshot[1]);
    }
    navigate(basePath, { state: keep ? { ...state, start, end } : state });
    if (keep) setToast("Loop updated");
  };
  const save = () => {
    if (edit) return leaveEdit(true);
    setPlaying(false);
    setToast("Saved to your library");
    setTimeout(() => navigate("/library"), 1000);
  };

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-40 pt-6 sm:px-8 sm:pt-10">
        <motion.div variants={fadeUp}>
          <Link
            to={edit ? basePath : saved ? "/library" : "/upload"}
            state={state}
            onClick={(e) => {
              if (edit) {
                e.preventDefault();
                leaveEdit(false);
              }
            }}
            className="glass group inline-flex items-center gap-2 rounded-full py-2 pl-3 pr-4 text-sm text-paper/55 transition-colors hover:text-paper"
          >
            <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={String(edit)} {...swap}>
                {edit ? "Back to result" : saved ? "Library" : "New analysis"}
              </motion.span>
            </AnimatePresence>
          </Link>
        </motion.div>

        <motion.div variants={stagger(0.08, 0.05)} className="mt-8 flex flex-wrap items-end justify-between gap-8">
          <div className="min-w-0">
            <motion.div variants={fadeUp}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={String(edit)} {...swap}>
                  <Eyebrow
                    icon={
                      edit ? (
                        <SlidersHorizontal size={13} className="text-iris" />
                      ) : (
                        <Sparkles size={13} className="text-orchid" />
                      )
                    }
                  >
                    {edit ? "Loop editor" : "Analysis complete"}
                  </Eyebrow>
                </motion.div>
              </AnimatePresence>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-7xl"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={String(edit)} className="inline-block" {...swap}>
                  {edit ? (
                    <>
                      Dial in the <Serif spectrum>pocket.</Serif>
                    </>
                  ) : (
                    <>
                      We found your <Serif spectrum>moment.</Serif>
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.h1>
            <motion.div variants={fadeUp} className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="truncate text-paper/60">{track.title}</span>
              <span className="size-1 rounded-full bg-paper/20" />
              <span className="flex items-center gap-1.5 rounded-full bg-white/[.05] px-2.5 py-1 text-xs text-paper/70">
                <span className="size-1.5 rounded-full" style={{ background: genreColor[genre] }} />
                {genre}
              </span>
            </motion.div>
          </div>

          <motion.div
            variants={{ hidden: { opacity: 0, scale: 0.6 }, show: { opacity: 1, scale: 1, transition: bouncy } }}
            className="flex items-center gap-4"
          >
            <span className="text-right">
              <span className="block text-sm font-medium">{playing ? "Playing loop" : "Play loop"}</span>
              <span className="mt-0.5 hidden font-mono text-[10px] uppercase tracking-[.18em] text-paper/30 sm:block">
                Space to toggle
              </span>
            </span>
            <PlayButton
              playing={playing}
              onClick={() => setPlaying((p) => !p)}
              label={playing ? "Pause loop" : "Play loop"}
              size={68}
            />
          </motion.div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 30, scale: 0.98, filter: "blur(10px)" },
            show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", transition: { duration: 0.9, ease: easeOutExpo, delay: 0.15 } },
          }}
          className="mt-10"
        >
          <Waveform
            editable={edit}
            start={start}
            end={end}
            bars={track.bars}
            duration={track.duration}
            color={track.color}
            minLength={barPct}
            playhead={playing || (pos != null && pos >= start && pos <= end) ? pos : null}
            onChange={(s, e) => {
              setStart(s);
              setEnd(e);
            }}
            onSeek={(p) => {
              if (p >= start && p <= end) setPos(p);
            }}
          />
        </motion.div>

        <AnimatePresence initial={false}>
          {edit && (
            <motion.div
              key="nudge"
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={spring}
              className="overflow-hidden"
            >
              <div className="glass flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-ink-2/40 px-4 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-6">
                  {(["start", "end"] as const).map((w) => (
                    <div key={w} className="flex items-center gap-2">
                      <span className="w-9 font-mono text-[10px] uppercase tracking-[.18em] text-paper/40">{w}</span>
                      <NudgeButton label={`Move ${w} one bar earlier`} onClick={() => nudge(w, -barPct)}>
                        <Minus size={13} />
                      </NudgeButton>
                      <span className="relative h-4 w-12 overflow-hidden text-center font-mono text-paper/85">
                        <motion.span
                          key={formatTime(((w === "start" ? start : end) / 100) * track.duration)}
                          initial={{ y: 12, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="absolute inset-0"
                        >
                          {formatTime(((w === "start" ? start : end) / 100) * track.duration)}
                        </motion.span>
                      </span>
                      <NudgeButton label={`Move ${w} one bar later`} onClick={() => nudge(w, barPct)}>
                        <Plus size={13} />
                      </NudgeButton>
                    </div>
                  ))}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  whileHover="hover"
                  disabled={!modified}
                  onClick={() => {
                    setStart(track.aiStart);
                    setEnd(track.aiEnd);
                  }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-2 text-paper/55 transition-colors hover:bg-white/[.06] hover:text-paper disabled:opacity-30"
                >
                  <motion.span className="inline-flex" variants={{ hover: { rotate: -180 } }} transition={spring}>
                    <RotateCcw size={13} />
                  </motion.span>
                  Reset to AI pick
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={stagger(0.06, 0.25)} className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Length">
            <Num value={barsCount} /> <span className="text-sm font-normal text-paper/40">bars ·</span>{" "}
            <Num value={loopSeconds} format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }} suffix="s" className="text-sm font-normal text-paper/60" />
          </Stat>
          <Stat label="Tempo">
            <Num value={track.bpm} /> <span className="text-sm font-normal text-paper/40">BPM</span>
          </Stat>
          <Stat label="Key">
            <span className="font-serif text-2xl font-normal italic">{track.musicalKey}</span>
          </Stat>
          <Stat label="Range">
            <span className="font-mono text-base">
              {formatTime((start / 100) * track.duration)}–{formatTime((end / 100) * track.duration)}
            </span>
          </Stat>
        </motion.div>

        <motion.div variants={stagger(0.12, 0.35)} className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          {/* Why this loop */}
          <motion.div variants={fadeUp} className="glass ring-spectrum relative overflow-hidden rounded-[28px] bg-ink-2/40 p-6 sm:p-8">
            <div aria-hidden className="absolute -right-24 -top-24 size-72 rounded-full bg-spectrum opacity-[.12] blur-[70px]" />
            <div className="relative flex items-center justify-between gap-3">
              <Eyebrow icon={<Sparkles size={13} className="text-orchid" />}>Why this loop</Eyebrow>
              <AnimatePresence>
                {modified && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={bouncy}
                    className="rounded-full bg-white/[.08] px-2.5 py-1 text-[11px] text-paper/60"
                  >
                    Edited by you
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="relative mt-5 min-h-[112px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p key={genre} {...swap} className="text-xl leading-9 tracking-[-.01em] text-paper/85 sm:text-2xl sm:leading-10">
                  This section repeats 6 times and has {reasons[genre]} — a strong{" "}
                  <Serif spectrum>{genre}</Serif> pick.
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="relative mt-6">
              <div className="flex items-center justify-between text-xs">
                <span className="text-paper/45">Loop confidence</span>
                <span className="text-sm text-mint">
                  {modified ? "—" : <Num value={94} suffix="%" />}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/[.07]">
                <motion.div
                  className="h-full rounded-full bg-spectrum shadow-[0_0_14px_rgba(159,180,255,.7)]"
                  initial={{ width: "0%" }}
                  animate={{ width: modified ? "0%" : "94%" }}
                  transition={{ duration: 1.2, ease: easeOutExpo, delay: modified ? 0 : 0.6 }}
                />
              </div>
            </div>
            <motion.ul initial="hidden" animate="show" variants={stagger(0.1, 0.8)} className="relative mt-7 space-y-2.5 text-sm text-paper/60">
              {[
                "Starts on a downbeat — no clicks at the seam",
                "Low vocal bleed in the drum stem",
                `Energy matches typical ${genre} arrangements`,
              ].map((r) => (
                <motion.li
                  key={r}
                  variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: spring } }}
                  className="flex items-start gap-2.5"
                >
                  <motion.span
                    variants={{ hidden: { scale: 0 }, show: { scale: 1, transition: bouncy } }}
                    className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-mint/15 text-mint"
                  >
                    <Check size={10} strokeWidth={3.5} />
                  </motion.span>
                  {r}
                </motion.li>
              ))}
            </motion.ul>
            <div className="relative mt-7 border-t border-white/[.07] pt-6">
              <p className="font-mono text-[10px] uppercase tracking-[.2em] text-paper/35">Re-score for a different genre</p>
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {genres.map((g) => {
                  const on = genre === g;
                  return (
                    <motion.button
                      key={g}
                      type="button"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setGenre(g)}
                      aria-pressed={on}
                      className={`relative rounded-full px-3.5 py-1.5 text-xs transition-colors ${on ? "font-medium text-on-accent" : "bg-white/[.05] text-paper/55 hover:bg-white/10 hover:text-paper"}`}
                    >
                      {on && (
                        <motion.span
                          layoutId="genre-chip"
                          transition={spring}
                          className="absolute inset-0 rounded-full"
                          style={{ background: genreColor[g], boxShadow: `0 6px 24px -6px ${genreColor[g]}` }}
                        />
                      )}
                      <span className="relative">{g}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Stem mixer */}
          <motion.div variants={fadeUp} className="glass rounded-[28px] bg-ink-2/40 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <Eyebrow icon={<SlidersHorizontal size={13} className="text-iris" />}>Stem mixer</Eyebrow>
              <AnimatePresence>
                {(solo || muted.length > 0) && (
                  <motion.button
                    type="button"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSolo(null);
                      setMuted([]);
                    }}
                    className="rounded-full px-2.5 py-1 text-xs text-paper/45 transition-colors hover:bg-white/[.06] hover:text-paper"
                  >
                    Reset
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <motion.div initial="hidden" animate="show" variants={stagger(0.06, 0.5)} className="mt-6 space-y-1">
              {stems.map((s) => {
                const on = audible(s);
                const isMuted = muted.includes(s);
                const c = stemColor[s];
                return (
                  <motion.div
                    key={s}
                    variants={{ hidden: { opacity: 0, x: 16 }, show: { opacity: 1, x: 0, transition: spring } }}
                    className="flex items-center gap-3 rounded-2xl px-2 py-1 transition-colors hover:bg-white/[.025]"
                  >
                    <motion.div animate={{ opacity: on ? 1 : 0.4 }} className="flex min-w-0 flex-1 items-center gap-3">
                      <motion.span
                        animate={{ scale: solo === s ? 1.2 : 1 }}
                        transition={bouncy}
                        className="grid size-8 shrink-0 place-items-center rounded-xl"
                        style={{ background: alpha(c, on ? 0.14 : 0.05), color: on ? c : "rgba(244,241,234,.4)" }}
                      >
                        <IconFor stem={s} size={14} />
                      </motion.span>
                      <span className="flex w-16 items-center gap-1.5 text-xs text-paper/75">
                        {s}
                        {playing && on && (
                          <span style={{ color: c }}>
                            <EqBars count={3} className="h-2" barClassName="w-[2px]" />
                          </span>
                        )}
                      </span>
                      <Slider
                        aria-label={`${s} volume`}
                        value={vol[s]}
                        disabled={!on}
                        valueLabelDisplay="auto"
                        onChange={(_, v) => setVol({ ...vol, [s]: v as number })}
                        style={{ "--slider-fill": c, "--slider-glow": alpha(c, 0.55) } as CSSProperties}
                        className="min-w-0 flex-1"
                      />
                    </motion.div>
                    <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.8 }}
                        aria-label={`${isMuted ? "Unmute" : "Mute"} ${s}`}
                        aria-pressed={isMuted}
                        onClick={() => setMuted((m) => (m.includes(s) ? m.filter((x) => x !== s) : [...m, s]))}
                        animate={{
                          backgroundColor: isMuted ? "rgba(255,138,138,.15)" : "rgba(255,255,255,0)",
                          color: isMuted ? "#ff8a8a" : "rgba(244,241,234,.4)",
                        }}
                        className="grid size-8 place-items-center rounded-full hover:text-paper"
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.span
                            key={String(isMuted)}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.4, opacity: 0 }}
                            transition={{ duration: 0.12 }}
                          >
                            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    </Tooltip>
                    <Tooltip title={solo === s ? "Unsolo" : "Solo"}>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.8 }}
                        aria-label={`Solo ${s}`}
                        aria-pressed={solo === s}
                        onClick={() => setSolo((x) => (x === s ? null : s))}
                        animate={{
                          backgroundColor: solo === s ? c : alpha(c, 0),
                          color: solo === s ? "#0a0a0f" : "rgba(244,241,234,.4)",
                          scale: solo === s ? [1, 1.25, 1] : 1,
                        }}
                        className="grid size-8 place-items-center rounded-full font-mono text-[11px] font-semibold hover:text-paper"
                      >
                        S
                      </motion.button>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <ActionBar width="max-w-4xl">
        <div className="flex items-center justify-between gap-3 p-2.5 pl-3 sm:pl-5">
          <p className="hidden items-center gap-2.5 text-sm text-paper/50 sm:flex">
            <motion.span
              className="inline-flex text-iris"
              animate={playing ? { rotate: 360 } : { rotate: 0 }}
              transition={playing ? { duration: 2, repeat: Infinity, ease: "linear" } : spring}
            >
              <Repeat size={15} />
            </motion.span>
            <span className="text-paper/85">
              <Num value={barsCount} />-bar loop
            </span>
            <span className="size-1 rounded-full bg-paper/20" />
            <span style={{ color: genreColor[genre] }}>{genre}</span>
          </p>
          <motion.div layout className="flex w-full gap-2.5 sm:w-auto">
            <motion.button
              layout
              {...press}
              type="button"
              onClick={() => (edit ? leaveEdit(false) : enterEdit())}
              className={`${btn.secondary} flex-1 overflow-hidden sm:flex-none`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={String(edit)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.12 }}
                  className="inline-flex items-center gap-2"
                >
                  {edit ? (
                    "Cancel"
                  ) : (
                    <>
                      <SlidersHorizontal size={15} /> Adjust loop
                    </>
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>
            <motion.button
              layout
              {...press}
              type="button"
              onClick={save}
              className={`${btn.primary} flex-1 sm:flex-none`}
            >
              <Save size={16} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={String(edit)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.12 }}
                >
                  {edit ? "Save loop" : saved ? "Update loop" : "Save to library"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </div>
      </ActionBar>

      <Toast message={toast} />
    </>
  );
}
