import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ArrowRight, AudioLines, Check, FileAudio, Sparkles } from "lucide-react";
import { Mark } from "../../components/brand/logo";
import { Footer } from "../../components/shell";
import { Magnetic } from "../../components/fx/magnetic";
import { SplitText } from "../../components/fx/split-text";
import { SpotlightCard } from "../../components/fx/spotlight-card";
import { VelocityMarquee } from "../../components/fx/velocity-marquee";
import { Waveform } from "../../components/waveform";
import { Eyebrow, IconFor, Num, PlayButton, Serif } from "../../components/ui";
import { btn } from "../../lib/styles";
import { demoWave, genreColor, genres, palette, stemColor } from "../../lib/sonoscope";
import { easeOutExpo, fadeUp, popIn, spring, stagger } from "../../lib/motion";

const LOOP = { start: 30, end: 47 };
const HERO_WAVE = demoWave(1, 88);

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-14 text-center sm:px-8 sm:pt-20">
      <motion.div variants={stagger(0.1, 0.05)} className="flex flex-col items-center">
        <motion.div variants={popIn}>
          <Link
            to="/library"
            className="glass group inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-xs transition-colors hover:border-white/20"
          >
            <span className="grid size-6 place-items-center rounded-full bg-ink-3">
              <Mark size={16} animated speed={1.4} />
            </span>
            <span className="shiny-text font-medium">AI loop discovery for producers</span>
            <ArrowRight size={13} className="text-paper/40 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <h1 className="mt-9 text-[clamp(3.1rem,10.5vw,8.6rem)] font-semibold leading-[.9] tracking-[-.065em]">
          <span className="block">
            <SplitText text="Find the moment" delay={0.15} />
          </span>
          <span className="block">
            <SplitText text="worth" delay={0.55} className="text-paper/40" />{" "}
            {/* Revealed as one piece: per-letter transforms break background-clip: text. */}
            <span className="inline-block overflow-hidden pb-[.14em] -mb-[.14em] align-bottom">
              <motion.span
                className="inline-block pr-[.08em] font-serif font-normal italic tracking-[-.02em] text-spectrum"
                initial={{ y: "100%", opacity: 0, filter: "blur(12px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.75 }}
              >
                looping.
              </motion.span>
            </span>
          </span>
        </h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-8 max-w-xl text-pretty text-lg leading-8 text-paper/55"
        >
          Sonoscope listens to your track, finds its most repeatable pocket, and
          hands you a loop you can actually flip.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Magnetic>
            <Link to="/upload" className={`${btn.primary} group h-14 px-7 text-[15px]`}>
              Analyze a track
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Magnetic>
          <Link to="/library" className={`${btn.secondary} h-14 px-6 text-[15px]`}>
            <AudioLines size={16} /> Hear examples
          </Link>
        </motion.div>

        <motion.p
          variants={fadeUp}
          className="mt-7 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[.18em] text-paper/30"
        >
          Free <span className="size-1 rounded-full bg-mint/60" /> No account
          <span className="size-1 rounded-full bg-orchid/60" /> ~30 seconds
        </motion.p>
      </motion.div>
    </section>
  );
}

/* ---------- Hero demo: tilts flat as it scrolls into view ---------- */

function StemMeter({ stem, playing, i }: { stem: string; playing: boolean; i: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex w-4" style={{ color: stemColor[stem] }}>
        <IconFor stem={stem} size={14} />
      </span>
      <span className="w-12 text-xs text-paper/55">{stem}</span>
      <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.06]">
        <motion.div
          className="absolute inset-y-0 left-0 origin-left rounded-full"
          style={{ background: stemColor[stem], width: "100%" }}
          animate={
            playing
              ? { scaleX: [0.35, 0.85, 0.5, 0.95, 0.4].map((v) => v * (1 - i * 0.12)) }
              : { scaleX: 0.25 * (1 - i * 0.1) }
          }
          transition={
            playing
              ? { duration: 1.4 + i * 0.2, repeat: Infinity, ease: "easeInOut" }
              : spring
          }
        />
      </div>
    </div>
  );
}

function HeroDemo() {
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start end", "center center"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 26 });
  const rotateX = useTransform(p, [0, 1], [24, 0]);
  const scale = useTransform(p, [0, 1], [0.88, 1]);
  const y = useTransform(p, [0, 1], [60, 0]);

  const inView = useInView(wrap, { once: true, amount: 0.4 });
  const [playing, setPlaying] = useState(true);
  const [pos, setPos] = useState(LOOP.start);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPos((v) => (v + 0.18 > LOOP.end ? LOOP.start : v + 0.18)), 40);
    return () => clearInterval(id);
  }, [playing]);

  return (
    <section ref={wrap} className="relative mx-auto max-w-5xl px-4 pb-24 sm:px-8" style={{ perspective: 1400 }}>
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 60 },
          show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: easeOutExpo, delay: 0.9 } },
        }}
      >
        <motion.div style={{ rotateX, scale, y, transformOrigin: "50% 0%" }} className="relative">
          <div aria-hidden className="absolute -inset-10 -z-10 rounded-[60px] bg-spectrum opacity-[.13] blur-[80px]" />
          <div className="glass relative overflow-hidden rounded-[32px] bg-ink-2/60 p-3 sm:p-4">
            <div className="rounded-[24px] border border-white/[.06] bg-ink/60 p-4 sm:p-7">
              <div className="flex items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-peach/90 to-orchid/80 text-on-accent">
                  <FileAudio size={20} />
                </span>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate font-medium text-paper/90">midnight-drive.wav</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-[.14em] text-paper/35">
                    <span>Hip-Hop</span>
                    <span>92 BPM</span>
                    <span>F minor</span>
                  </p>
                </div>
                <PlayButton
                  playing={playing}
                  onClick={() => setPlaying((v) => !v)}
                  label={playing ? "Pause demo" : "Play demo"}
                  size={52}
                />
              </div>

              <div className="mt-7">
                <Waveform {...LOOP} bars={HERO_WAVE} playhead={pos} framed={false} />
              </div>

              <div className="mt-7 grid gap-3 text-left sm:grid-cols-[1.25fr_1fr]">
                <div className="ring-spectrum relative rounded-2xl bg-white/[.025] p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[.18em] text-paper/70">
                      <Sparkles size={13} className="text-orchid" /> AI picked this
                    </span>
                    <span className="rounded-full bg-mint/10 px-2.5 py-1 text-xs text-mint">
                      <Num value={inView ? 94 : 0} suffix="%" /> match
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-paper/75">
                    A 16-bar drum pocket with a clean transient and a{" "}
                    <Serif>satisfying swing.</Serif>
                  </p>
                </div>
                <div className="space-y-3.5 rounded-2xl border border-white/[.06] bg-white/[.02] p-5">
                  {["Drums", "Bass", "Piano", "Vocals"].map((s, i) => (
                    <StemMeter key={s} stem={s} playing={playing} i={i} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ---------- Marquee ---------- */

const tags = ["Drum breaks", "Vocal chops", "Bass lines", "Chord stabs", "Lo-fi keys", "Synth riffs", "808 patterns", "Guitar licks"];

function Marquees() {
  return (
    <section aria-label="What sonoscope finds" className="relative space-y-2 border-y border-white/[.06] bg-ink/40 py-8 mask-fade-x">
      <VelocityMarquee baseVelocity={-1.2}>
        {tags.map((t, i) => (
          <span key={t} className="flex items-center gap-8 pr-8 text-4xl font-semibold tracking-[-.04em] text-paper/80 sm:text-6xl">
            {i % 2 ? <Serif>{t}</Serif> : t}
            <span className="text-2xl text-paper/20">✦</span>
          </span>
        ))}
      </VelocityMarquee>
      <VelocityMarquee baseVelocity={1}>
        {genres.map((g) => (
          <span key={g} className="flex items-center gap-8 pr-8 text-4xl font-semibold tracking-[-.04em] sm:text-6xl">
            <span style={{ WebkitTextStroke: `1px ${genreColor[g]}`, color: "transparent" }}>{g}</span>
            <span className="text-2xl text-paper/20">✦</span>
          </span>
        ))}
      </VelocityMarquee>
    </section>
  );
}

/* ---------- How it works: a sticky, scroll-driven story ---------- */

const steps = [
  {
    title: "Drop in a track",
    body: "WAV, MP3, AIFF or FLAC. Tell us what you're producing so we know what to listen for.",
  },
  {
    title: "Sonoscope listens",
    body: "We separate the stems, map repetition and energy, and score every candidate loop.",
  },
  {
    title: "Make it yours",
    body: "Drag the loop points, balance the stems, and save the pocket to your library.",
  },
];

function DropVisual() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 p-8">
      <div className="relative grid h-40 w-full max-w-sm place-items-center rounded-3xl border-2 border-dashed border-white/12">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute size-24 rounded-full border border-iris/40"
            animate={{ scale: [0.6, 1.8], opacity: [0.6, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "easeOut" }}
          />
        ))}
        <motion.div
          className="glass relative flex items-center gap-3 rounded-2xl bg-ink-3/80 px-4 py-3"
          animate={{ y: [-90, 0, 0, -90], rotate: [-8, 0, 0, -8], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.3, 0.8, 1], ease: easeOutExpo }}
        >
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-mint to-iris text-on-accent">
            <FileAudio size={16} />
          </span>
          <span className="text-left text-sm">
            <span className="block font-medium">velvet-room.mp3</span>
            <span className="block font-mono text-[10px] text-paper/40">8.2 MB · 04:01</span>
          </span>
        </motion.div>
      </div>
      <div className="flex w-full max-w-sm items-center gap-[3px]">
        {demoWave(5, 40).map((h, i) => (
          <motion.span
            key={i}
            className="h-12 w-full origin-center rounded-full bg-white/25"
            style={{ scaleY: h / 100 }}
            animate={{ opacity: [0.15, 1, 1, 0.15] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.02, times: [0.25, 0.45, 0.85, 1] }}
          />
        ))}
      </div>
    </div>
  );
}

function ListenVisual() {
  const rows = ["Vocals", "Drums", "Bass", "Piano"];
  return (
    <div className="relative flex h-full flex-col justify-center gap-4 overflow-hidden p-8">
      {rows.map((s, r) => (
        <motion.div
          key={s}
          initial={{ y: (1.5 - r) * 52, opacity: 0.4 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, ease: easeOutExpo, delay: 0.2 + r * 0.08 }}
          className="flex items-center gap-4"
        >
          <span className="flex w-20 items-center gap-2 text-xs text-paper/60">
            <span style={{ color: stemColor[s] }} className="inline-flex">
              <IconFor stem={s} size={14} />
            </span>
            {s}
          </span>
          <div className="flex h-10 flex-1 items-center gap-[2px]">
            {demoWave(r * 7 + 2, 48).map((h, i) => (
              <span
                key={i}
                className="w-full rounded-full"
                style={{ height: `${h * (r === 1 ? 1 : 0.7)}%`, background: stemColor[s], opacity: 0.85 }}
              />
            ))}
          </div>
        </motion.div>
      ))}
      <motion.div
        aria-hidden
        className="absolute inset-y-6 w-24 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        animate={{ left: ["-20%", "110%"] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
      />
    </div>
  );
}

function ShapeVisual() {
  const [range, setRange] = useState({ start: 22, end: 58 });
  useEffect(() => {
    const frames = [
      { start: 22, end: 58 },
      { start: 30, end: 52 },
      { start: 30, end: 62 },
    ];
    let i = 0;
    const id = setInterval(() => setRange(frames[++i % frames.length]), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex h-full flex-col justify-center gap-6 p-6 sm:p-8">
      <Waveform {...range} bars={demoWave(9, 56)} editable framed={false} duration={241} />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...spring, delay: 0.6 }}
        className="mx-auto flex items-center gap-2 rounded-full bg-mint/10 px-3.5 py-1.5 text-xs text-mint"
      >
        <Check size={13} strokeWidth={3} /> Saved to library
      </motion.div>
    </div>
  );
}

const visuals = [DropVisual, ListenVisual, ShapeVisual];

function StepRail({ progress, i }: { progress: MotionValue<number>; i: number }) {
  const fill = useTransform(progress, [i / 3, (i + 1) / 3], [0, 1]);
  return (
    <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/[.08]">
      <motion.div className="h-full origin-left rounded-full bg-spectrum" style={{ scaleX: fill }} />
    </div>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(2, Math.floor(v * 3))));
  const Visual = visuals[active];

  return (
    <section ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[.9fr_1.1fr] lg:gap-16">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <div className="mt-6 flex items-baseline gap-4">
              <span className="font-mono text-sm text-paper/30">
                <Num value={active + 1} format={{ minimumIntegerDigits: 2 }} /> / 03
              </span>
            </div>
            <div className="relative mt-3 min-h-[180px] sm:min-h-[210px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -24, filter: "blur(8px)" }}
                  transition={{ duration: 0.5, ease: easeOutExpo }}
                >
                  <h2 className="text-4xl font-semibold leading-[1] tracking-[-.055em] sm:text-6xl">
                    {steps[active].title.split(" ").slice(0, -1).join(" ")}{" "}
                    <Serif spectrum>{steps[active].title.split(" ").slice(-1)}</Serif>
                  </h2>
                  <p className="mt-5 max-w-md text-base leading-7 text-paper/50 sm:text-lg">
                    {steps[active].body}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-6 flex max-w-md gap-2">
              {steps.map((_, i) => (
                <StepRail key={i} progress={scrollYProgress} i={i} />
              ))}
            </div>
          </div>

          <SpotlightCard
            tilt={6}
            glow="rgba(159,180,255,.12)"
            className="glass aspect-[4/3] max-h-[52vh] overflow-hidden rounded-[32px] bg-ink-2/50 lg:max-h-none"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                className="relative h-full"
                initial={{ opacity: 0, scale: 0.94, filter: "blur(10px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: easeOutExpo }}
              >
                <Visual />
              </motion.div>
            </AnimatePresence>
          </SpotlightCard>
        </div>
      </div>
    </section>
  );
}

/* ---------- Bento ---------- */

function Gauge({ value }: { value: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <div className="relative mx-auto grid size-40 place-items-center">
      <svg ref={ref} viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
        <defs>
          <linearGradient id="gauge" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor={palette.mint} />
            <stop offset=".5" stopColor={palette.iris} />
            <stop offset="1" stopColor={palette.orchid} />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,.07)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="50"
          cy="50"
          r="42"
          stroke="url(#gauge)"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: inView ? value / 100 : 0 }}
          transition={{ duration: 1.8, ease: easeOutExpo, delay: 0.2 }}
        />
      </svg>
      <span className="text-4xl font-semibold tracking-[-.05em]">
        <Num value={inView ? value : 0} suffix="%" />
      </span>
    </div>
  );
}

function TempoKey() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  return (
    <div ref={ref} className="flex items-end gap-6">
      <div>
        <p className="text-6xl font-semibold tracking-[-.06em]">
          <Num value={inView ? 92 : 0} />
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[.2em] text-paper/35">BPM</p>
      </div>
      <div className="pb-1">
        <p className="font-serif text-5xl italic text-spectrum">F minor</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[.2em] text-paper/35">Key</p>
      </div>
    </div>
  );
}

function GenreCycle() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % genres.length), 1300);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((g, k) => (
        <span
          key={g}
          className={`relative rounded-full px-4 py-2 text-sm transition-colors duration-300 ${k === i ? "text-on-accent" : "bg-white/[.04] text-paper/55"}`}
        >
          {k === i && (
            <motion.span
              layoutId="genre-cycle"
              transition={spring}
              className="absolute inset-0 rounded-full"
              style={{ background: genreColor[g], boxShadow: `0 8px 30px -8px ${genreColor[g]}` }}
            />
          )}
          <span className="relative">{g}</span>
        </span>
      ))}
    </div>
  );
}

function StemColumns() {
  const list = ["Vocals", "Drums", "Bass", "Guitar", "Piano", "Other"];
  return (
    <div className="flex h-36 items-end gap-3 sm:gap-5">
      {list.map((s, i) => (
        <div key={s} className="flex h-full flex-1 flex-col items-center gap-3">
          <div className="relative w-full flex-1 overflow-hidden rounded-xl bg-white/[.03]">
            <motion.div
              className="absolute inset-x-0 bottom-0 origin-bottom rounded-xl"
              style={{ background: `linear-gradient(180deg, ${stemColor[s]}, ${stemColor[s]}33)`, height: "100%" }}
              animate={{ scaleY: [0.3, 0.9, 0.5, 0.75, 0.3].map((v) => v * (1 - (i % 3) * 0.15)) }}
              transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <span className="inline-flex text-paper/50" style={{ color: stemColor[s] }}>
            <IconFor stem={s} size={15} />
          </span>
        </div>
      ))}
    </div>
  );
}

function Bento() {
  const cards = [
    {
      span: "md:col-span-2",
      eyebrow: "Stem-aware",
      title: (
        <>
          Hears every <Serif>layer</Serif> on its own.
        </>
      ),
      body: "Vocals, drums, bass, guitar, keys — separated before scoring, so the loop it picks is clean where it matters.",
      visual: <StemColumns />,
      glow: "rgba(255,194,154,.12)",
    },
    {
      span: "",
      eyebrow: "Confidence",
      title: <>Scored, not guessed.</>,
      body: "Seam, groove and energy rolled into one number.",
      visual: <Gauge value={94} />,
      glow: "rgba(142,240,201,.12)",
    },
    {
      span: "",
      eyebrow: "Key & tempo",
      title: <>Ready for your session.</>,
      body: "Tempo and key detected, so it drops straight into your project.",
      visual: <TempoKey />,
      glow: "rgba(230,168,255,.12)",
    },
    {
      span: "md:col-span-2",
      eyebrow: "Genre-aware",
      title: (
        <>
          Listens like a <Serif>producer</Serif> would.
        </>
      ),
      body: "A hip-hop head wants the drum pocket; an R&B writer wants the chords. Tell Sonoscope which you are.",
      visual: <GenreCycle />,
      glow: "rgba(159,180,255,.12)",
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-5 py-28 sm:px-8">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.5 }}
        variants={stagger(0.08)}
        className="max-w-2xl"
      >
        <motion.div variants={fadeUp}>
          <Eyebrow>Under the hood</Eyebrow>
        </motion.div>
        <motion.h2 variants={fadeUp} className="mt-5 text-4xl font-semibold leading-[1.02] tracking-[-.055em] sm:text-6xl">
          An instrument for <Serif spectrum>listening closely.</Serif>
        </motion.h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        variants={stagger(0.1)}
        className="mt-14 grid gap-4 md:grid-cols-3"
      >
        {cards.map((c) => (
          <motion.div key={c.eyebrow} variants={fadeUp} className={c.span}>
            <SpotlightCard glow={c.glow} className="glass flex h-full flex-col justify-between gap-10 overflow-hidden rounded-[28px] bg-ink-2/40 p-7 sm:p-8">
              <div className="relative">{c.visual}</div>
              <div className="relative">
                <p className="font-mono text-[11px] uppercase tracking-[.2em] text-paper/35">{c.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-.04em]">{c.title}</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-paper/45">{c.body}</p>
              </div>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---------- Closing CTA ---------- */

function Closing() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, ease: easeOutExpo }}
        className="glass relative overflow-hidden rounded-[40px] bg-ink-2/40 px-6 py-20 text-center sm:py-28"
      >
        <div aria-hidden className="absolute left-1/2 top-0 h-80 w-[680px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-spectrum opacity-25 blur-[100px]" />
        <motion.div
          className="relative mx-auto w-fit"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Mark size={112} animated glow speed={0.9} />
        </motion.div>
        <h2 className="relative mx-auto mt-10 max-w-3xl text-4xl font-semibold leading-[1] tracking-[-.06em] sm:text-7xl">
          Your next sample is already{" "}
          <Serif spectrum>in your music.</Serif>
        </h2>
        <p className="relative mx-auto mt-6 max-w-md text-paper/50">
          It takes less time than scrolling a sample pack.
        </p>
        <div className="relative mt-10 flex justify-center">
          <Magnetic>
            <Link to="/upload" className={`${btn.primary} group h-14 px-8 text-[15px]`}>
              Start listening
              <ArrowRight size={17} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Magnetic>
        </div>
      </motion.div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <HeroDemo />
      <Marquees />
      <HowItWorks />
      <Bento />
      <Closing />
      <Footer />
    </>
  );
}
