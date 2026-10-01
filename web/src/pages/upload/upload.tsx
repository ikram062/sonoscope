import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import Tooltip from "@mui/material/Tooltip";
import {
  ArrowRight,
  AudioWaveform,
  Check,
  CircleAlert,
  Drum,
  FileAudio,
  Mic2,
  Music2,
  Piano,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { Waveform } from "../../components/waveform";
import { SpotlightCard } from "../../components/fx/spotlight-card";
import { ActionBar, Eyebrow, PlayButton, Serif } from "../../components/ui";
import { btn } from "../../lib/styles";
import { alpha, formatBytes, formatTime, genreColor, genres } from "../../lib/sonoscope";
import { bouncy, easeOutExpo, fadeUp, press, spring, stagger } from "../../lib/motion";

const genreMeta: Record<string, { hint: string; icon: typeof Drum }> = {
  "Hip-Hop": { hint: "Drum breaks & chops", icon: Drum },
  "R&B": { hint: "Chords & vocal runs", icon: Mic2 },
  "Lo-Fi": { hint: "Dusty keys & texture", icon: Piano },
  Pop: { hint: "Hooks & toplines", icon: Music2 },
  Electronic: { hint: "Synth riffs & builds", icon: Zap },
  Other: { hint: "Let Sonoscope decide", icon: Sparkles },
};

const MAX_BYTES = 100 * 1024 * 1024;
const AUDIO_EXT = /\.(wav|mp3|aiff?|flac|m4a|ogg)$/i;
const BAR_COUNT = 120;

function StepHeading({ n, title, done }: { n: number; title: string; done: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <motion.span
        animate={{
          background: done
            ? "linear-gradient(135deg, #8ef0c9, #9fb4ff)"
            : "linear-gradient(135deg, rgba(255,255,255,.05), rgba(255,255,255,.05))",
          color: done ? "#0a0a0f" : "rgba(244,241,234,.55)",
        }}
        className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 font-mono text-xs"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={done ? "done" : "n"}
            initial={{ scale: 0, rotate: -120 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 120 }}
            transition={bouncy}
          >
            {done ? <Check size={14} strokeWidth={3} /> : `0${n}`}
          </motion.span>
        </AnimatePresence>
      </motion.span>
      <h2 className="text-lg font-medium tracking-[-.02em]">{title}</h2>
    </div>
  );
}

function Stepper({ items }: { items: { label: string; value: ReactNode; id: string; done: boolean }[] }) {
  return (
    <ol className="relative mt-10 space-y-6 pl-8">
      <span aria-hidden className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10" />
      {items.map((it, i) => (
        <li key={it.label} className="relative">
          <motion.span
            aria-hidden
            animate={{
              scale: it.done ? 1 : 0.7,
              backgroundColor: it.done ? "#8ef0c9" : "#15151c",
              boxShadow: it.done ? "0 0 16px rgba(142,240,201,.6)" : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ ...spring, delay: i * 0.05 }}
            className="absolute -left-8 top-1 size-[15px] rounded-full border border-white/15"
          />
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-paper/35">{it.label}</p>
          <div className="mt-1 min-h-6 truncate text-sm text-paper/80">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={it.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="truncate"
              >
                {it.value}
              </motion.div>
            </AnimatePresence>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LoadingWave() {
  return (
    <div className="glass flex h-[88px] items-center gap-[3px] rounded-[22px] px-4">
      {Array.from({ length: 48 }, (_, i) => (
        <motion.span
          key={i}
          className="w-full rounded-full bg-spectrum"
          style={{ backgroundSize: "4800% 100%", backgroundPosition: `${(i / 47) * 100}% 0` }}
          animate={{ height: ["12%", `${30 + ((i * 37) % 50)}%`, "12%"], opacity: [0.35, 0.9, 0.35] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut", delay: i * 0.025 }}
        />
      ))}
    </div>
  );
}

/** Rounded dashed outline drawn in SVG so the dashes can march while dragging. */
function MarchingBorder({ active, error }: { active: boolean; error: boolean }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 size-full">
      <defs>
        <linearGradient id="drop-edge" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#8ef0c9" />
          <stop offset=".5" stopColor="#9fb4ff" />
          <stop offset="1" stopColor="#e6a8ff" />
        </linearGradient>
      </defs>
      <motion.rect
        x="1"
        y="1"
        rx="27"
        style={{ width: "calc(100% - 2px)", height: "calc(100% - 2px)" }}
        fill="none"
        strokeWidth={active ? 2 : 1.5}
        strokeDasharray="8 10"
        stroke={error ? "rgba(255,138,138,.5)" : active ? "url(#drop-edge)" : "rgba(255,255,255,.16)"}
        animate={{ strokeDashoffset: active ? [0, -36] : 0 }}
        transition={active ? { duration: 0.6, repeat: Infinity, ease: "linear" } : { duration: 0 }}
      />
    </svg>
  );
}

export default function UploadPage() {
  const navigate = useNavigate();
  const [genre, setGenre] = useState("Hip-Hop");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const [bars, setBars] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [dropScope, animateDrop] = useAnimate<HTMLDivElement>();

  useEffect(() => () => void (url && URL.revokeObjectURL(url)), [url]);

  const reset = () => {
    audio.current?.pause();
    setFile(null);
    setBars(null);
    setDuration(0);
    setUrl(null);
    setPlaying(false);
    setPos(0);
    if (input.current) input.current.value = "";
  };

  const fail = (msg: string) => {
    setError(msg);
    if (dropScope.current)
      animateDrop(dropScope.current, { x: [0, -12, 10, -8, 6, -3, 0] }, { duration: 0.5 });
  };

  const selectFile = (f?: File) => {
    if (!f) return;
    if (!f.type.startsWith("audio/") && !AUDIO_EXT.test(f.name))
      return fail(`"${f.name}" isn't an audio file. Try WAV, MP3 or AIFF.`);
    if (f.size > MAX_BYTES) return fail(`That file is ${formatBytes(f.size)} — the limit is 100 MB.`);
    reset();
    setError(null);
    setFile(f);
    setUrl(URL.createObjectURL(f));
    setDecoding(true);

    const ctx = new AudioContext();
    f.arrayBuffer()
      .then((b) => ctx.decodeAudioData(b))
      .then((a) => {
        const data = a.getChannelData(0);
        const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
        const peaks = Array.from({ length: BAR_COUNT }, (_, i) => {
          let max = 0;
          for (let j = i * step; j < (i + 1) * step && j < data.length; j++)
            max = Math.max(max, Math.abs(data[j]));
          return max;
        });
        const top = Math.max(...peaks) || 1;
        setBars(peaks.map((p) => Math.max(6, (p / top) * 100)));
        setDuration(a.duration);
      })
      .catch(() => setBars(null))
      .finally(() => {
        setDecoding(false);
        ctx.close();
      });
  };

  const togglePlay = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play();
    else a.pause();
  };

  const analyze = () => {
    if (!file) return;
    audio.current?.pause();
    navigate("/processing", { state: { genre, fileName: file.name, duration, bars } });
  };

  const ready = !!file && !decoding;
  const accent = genreColor[genre];

  return (
    <>
      <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-44 pt-10 sm:px-8 sm:pt-14 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        {/* Left: intro + live summary */}
        <motion.div variants={stagger(0.08, 0.05)} className="lg:sticky lg:top-32 lg:self-start">
          <motion.div variants={fadeUp}>
            <Eyebrow>New analysis</Eyebrow>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="mt-5 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-6xl"
          >
            What are you <Serif spectrum>making?</Serif>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-sm leading-7 text-paper/50">
            Pick a direction so Sonoscope knows what to listen for, then drop in your track.
          </motion.p>
          <motion.div variants={fadeUp} className="hidden lg:block">
            <Stepper
              items={[
                {
                  label: "Listening for",
                  id: genre,
                  done: true,
                  value: (
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ background: accent }} />
                      {genre}
                    </span>
                  ),
                },
                {
                  label: "Track",
                  id: file?.name ?? "",
                  done: !!file,
                  value: file ? file.name : <span className="text-paper/30">Waiting for a file…</span>,
                },
                {
                  label: "Analysis",
                  id: String(ready),
                  done: ready,
                  value: ready ? "Ready when you are" : <span className="text-paper/30">Not started</span>,
                },
              ]}
            />
          </motion.div>
        </motion.div>

        {/* Right: the two steps */}
        <motion.div variants={stagger(0.15, 0.2)} className="space-y-14">
          <motion.div variants={fadeUp}>
            <StepHeading n={1} title="Choose a genre" done={!!genre} />
            <motion.div
              role="radiogroup"
              aria-label="Genre"
              variants={stagger(0.05, 0.1)}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              {genres.map((g) => {
                const { hint, icon: Icon } = genreMeta[g];
                const on = genre === g;
                const c = genreColor[g];
                return (
                  <motion.div
                    key={g}
                    variants={{
                      hidden: { opacity: 0, y: 20, scale: 0.94 },
                      show: { opacity: 1, y: 0, scale: 1, transition: spring },
                    }}
                  >
                    <SpotlightCard
                      tilt={8}
                      glow={alpha(c, 0.16)}
                      className="h-full rounded-[22px]"
                    >
                      <motion.button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setGenre(g)}
                        whileTap={{ scale: 0.96 }}
                        className={`relative flex h-full w-full flex-col items-start rounded-[22px] border p-4 text-left transition-colors sm:p-5 ${on ? "border-transparent" : "border-white/[.08] bg-white/[.02] hover:border-white/15"}`}
                        style={on ? { background: `linear-gradient(160deg, ${alpha(c, 0.16)}, ${alpha(c, 0.03)})` } : undefined}
                      >
                        {on && (
                          <motion.span
                            layoutId="genre-ring"
                            transition={spring}
                            className="absolute inset-0 rounded-[22px] border"
                            style={{ borderColor: alpha(c, 0.8), boxShadow: `0 0 0 4px ${alpha(c, 0.12)}, 0 18px 40px -16px ${alpha(c, 0.6)}` }}
                          />
                        )}
                        <motion.span
                          animate={{
                            backgroundColor: on ? c : "rgba(255,255,255,.05)",
                            color: on ? "#0a0a0f" : "rgba(244,241,234,.55)",
                            rotate: on ? [0, -12, 0] : 0,
                          }}
                          transition={bouncy}
                          className="relative grid size-10 place-items-center rounded-xl"
                        >
                          <Icon size={18} />
                        </motion.span>
                        <span className="relative mt-6 font-medium tracking-[-.01em]">{g}</span>
                        <span className="relative mt-0.5 text-xs text-paper/40">{hint}</span>
                        <AnimatePresence>
                          {on && (
                            <motion.span
                              initial={{ scale: 0, rotate: -90 }}
                              animate={{ scale: 1, rotate: 0 }}
                              exit={{ scale: 0, rotate: 90 }}
                              transition={bouncy}
                              className="absolute right-3.5 top-3.5 grid size-5 place-items-center rounded-full text-on-accent"
                              style={{ background: c }}
                            >
                              <Check size={12} strokeWidth={3} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <StepHeading n={2} title="Add your track" done={!!file} />
            <input
              ref={input}
              type="file"
              accept="audio/*,.wav,.mp3,.aif,.aiff,.flac,.m4a"
              className="sr-only"
              onChange={(e) => selectFile(e.target.files?.[0])}
            />
            <AnimatePresence mode="wait" initial={false}>
              {file ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.95, y: 12, filter: "blur(8px)" }}
                  animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, y: -8, filter: "blur(8px)" }}
                  transition={spring}
                  className="glass rounded-[28px] bg-ink-2/50 p-4 sm:p-5"
                >
                  <div className="flex items-center gap-3.5">
                    <PlayButton
                      playing={playing}
                      onClick={togglePlay}
                      disabled={!url}
                      label={playing ? "Pause preview" : "Play preview"}
                      size={46}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-paper/90">{file.name}</p>
                      <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-paper/35">
                        <span className="uppercase">{file.name.split(".").pop()}</span>
                        <span>·</span>
                        <span>{formatBytes(file.size)}</span>
                        {duration > 0 && (
                          <>
                            <span>·</span>
                            <span>
                              {playing || pos > 0 ? `${formatTime((pos / 100) * duration)} / ` : ""}
                              {formatTime(duration)}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                    <Tooltip title="Replace file">
                      <motion.button
                        {...press}
                        type="button"
                        onClick={() => input.current?.click()}
                        aria-label="Replace file"
                        className="grid size-10 place-items-center rounded-full text-paper/45 transition-colors hover:bg-white/[.06] hover:text-paper"
                      >
                        <RefreshCw size={15} />
                      </motion.button>
                    </Tooltip>
                    <Tooltip title="Remove">
                      <motion.button
                        whileHover={{ rotate: 90, scale: 1.1 }}
                        whileTap={{ scale: 0.85 }}
                        transition={spring}
                        type="button"
                        onClick={reset}
                        aria-label="Remove file"
                        className="grid size-10 place-items-center rounded-full text-paper/45 transition-colors hover:bg-white/[.06] hover:text-paper"
                      >
                        <X size={16} />
                      </motion.button>
                    </Tooltip>
                  </div>
                  <div className="mt-4">
                    <AnimatePresence mode="wait">
                      {decoding ? (
                        <motion.div key="loading" exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }}>
                          <LoadingWave />
                        </motion.div>
                      ) : bars ? (
                        <motion.div key="wave" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                          <Waveform
                            compact
                            bars={bars}
                            start={0}
                            end={100}
                            duration={duration}
                            playhead={playing || pos > 0 ? pos : null}
                            onSeek={(p) => {
                              const a = audio.current;
                              if (a && duration) {
                                a.currentTime = (p / 100) * duration;
                                setPos(p);
                              }
                            }}
                          />
                        </motion.div>
                      ) : (
                        <motion.p
                          key="none"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-2xl bg-white/[.03] px-4 py-3 text-xs text-paper/45"
                        >
                          We couldn't preview this format in your browser, but Sonoscope can still analyze it.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  {url && (
                    <audio
                      ref={audio}
                      src={url}
                      onPlay={() => setPlaying(true)}
                      onPause={() => setPlaying(false)}
                      onEnded={() => {
                        setPlaying(false);
                        setPos(0);
                      }}
                      onTimeUpdate={(e) => {
                        const a = e.currentTarget;
                        if (a.duration) setPos((a.currentTime / a.duration) * 100);
                      }}
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="drop"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }}
                  transition={spring}
                >
                  <motion.div
                    ref={dropScope}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload an audio file"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        input.current?.click();
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDrag(false);
                      selectFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => input.current?.click()}
                    animate={{ scale: drag ? 1.02 : 1 }}
                    whileHover="hover"
                    whileTap={{ scale: 0.99 }}
                    transition={spring}
                    className={`group relative cursor-pointer overflow-hidden rounded-[28px] px-6 py-16 text-center transition-colors duration-500 sm:py-20 ${drag ? "bg-iris/[.07]" : error ? "bg-danger/[.04]" : "bg-white/[.015] hover:bg-white/[.035]"}`}
                  >
                    <MarchingBorder active={drag} error={!!error && !drag} />
                    <AnimatePresence>
                      {drag && (
                        <motion.div
                          aria-hidden
                          initial={{ opacity: 0, scale: 0.4 }}
                          animate={{ opacity: 1, scale: 1.4 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.7, ease: easeOutExpo }}
                          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(159,180,255,.22),transparent_60%)]"
                        />
                      )}
                    </AnimatePresence>
                    <div className="relative mx-auto grid size-20 place-items-center">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          aria-hidden
                          className="absolute inset-0 rounded-full border border-white/15"
                          animate={{ scale: [1, drag ? 2.4 : 1.9], opacity: [0.5, 0] }}
                          transition={{ duration: drag ? 1.2 : 2.6, repeat: Infinity, delay: i * (drag ? 0.4 : 0.85), ease: "easeOut" }}
                        />
                      ))}
                      <motion.span
                        variants={{ hover: { y: -4, rotate: -6 } }}
                        animate={drag ? { y: [0, -8, 0], scale: 1.1 } : { y: 0, scale: 1 }}
                        transition={drag ? { y: { duration: 0.6, repeat: Infinity }, scale: spring } : spring}
                        className={`relative grid size-16 place-items-center rounded-2xl transition-colors duration-300 ${drag ? "bg-spectrum text-on-accent" : "glass text-paper/70 group-hover:text-paper"}`}
                      >
                        <Upload size={24} />
                      </motion.span>
                    </div>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.p
                        key={String(drag)}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="relative mt-7 text-xl font-medium tracking-[-.02em] text-paper/85"
                      >
                        {drag ? (
                          <>
                            Let it <Serif spectrum>go.</Serif>
                          </>
                        ) : (
                          <>
                            Drop your track here, or{" "}
                            <span className="text-spectrum underline decoration-white/20 underline-offset-[6px]">
                              browse
                            </span>
                          </>
                        )}
                      </motion.p>
                    </AnimatePresence>
                    <p className="relative mt-3 font-mono text-[11px] uppercase tracking-[.18em] text-paper/30">
                      WAV · MP3 · AIFF · FLAC — up to 100 MB
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={spring}
                  className="flex items-center gap-2 overflow-hidden text-sm text-danger"
                >
                  <CircleAlert size={15} /> {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </section>

      <ActionBar>
        <div className="flex items-center gap-4 p-2.5 pl-3 sm:pl-4">
          <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
            <motion.span
              animate={{
                backgroundColor: file ? alpha(accent, 0.15) : "rgba(255,255,255,.05)",
                color: file ? accent : "rgba(244,241,234,.45)",
              }}
              className="grid size-10 shrink-0 place-items-center rounded-2xl"
            >
              <FileAudio size={17} />
            </motion.span>
            <div className="min-w-0 overflow-hidden text-xs">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={file?.name ?? "none"}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -12, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="truncate text-sm text-paper/85"
                >
                  {file ? file.name : "No track selected"}
                </motion.p>
              </AnimatePresence>
              <p className="mt-0.5 flex items-center gap-1.5 text-paper/40">
                Listening for
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={genre}
                    initial={{ y: 8, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -8, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block font-medium"
                    style={{ color: accent }}
                  >
                    {genre}
                  </motion.span>
                </AnimatePresence>
              </p>
            </div>
          </div>
          <motion.button
            {...(ready ? press : {})}
            type="button"
            disabled={!ready}
            onClick={analyze}
            className={`${btn.primary} w-full sm:w-auto sm:px-7 ${ready ? "before:opacity-60" : ""}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={decoding ? "prep" : "go"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="inline-flex items-center gap-2"
              >
                {decoding ? (
                  <>
                    <motion.span
                      className="inline-flex"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                    >
                      <AudioWaveform size={16} />
                    </motion.span>
                    Preparing…
                  </>
                ) : (
                  <>
                    Analyze track <ArrowRight size={17} />
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </motion.button>
        </div>
      </ActionBar>
    </>
  );
}
