import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react";
import Slider from "@mui/material/Slider";
import Tooltip from "@mui/material/Tooltip";
import {
  AudioLines,
  CircleAlert,
  Cpu,
  Download,
  FileAudio,
  Headphones,
  Info,
  RotateCcw,
  Scissors,
  SlidersHorizontal,
  Split,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { Waveform } from "../../components/waveform";
import { ActionBar, EqBars, Eyebrow, IconFor, Num, PlayButton, Serif } from "../../components/ui";
import { btn } from "../../lib/styles";
import { alpha, formatBytes, formatTime, stemColor } from "../../lib/sonoscope";
import { bouncy, easeOutExpo, fadeUp, press, spring, stagger } from "../../lib/motion";
import {
  STEM_KEYS,
  StemApiError,
  deleteSeparation,
  estimateSeconds,
  getSeparation,
  startSeparation,
  type StemJob,
  type StemKey,
} from "../../lib/stems-api";
import { useStemPlayer, type PlayerSource } from "../../lib/use-stem-player";

const MAX_BYTES = 100 * 1024 * 1024;
const AUDIO_EXT = /\.(wav|mp3|aiff?|flac|m4a|aac|ogg)$/i;
const MIN_SECONDS = 10;
const MAX_SECONDS = 600;

const LENGTHS: { label: string; value: number | null }[] = [
  { label: "15 s", value: 15 },
  { label: "30 s", value: 30 },
  { label: "60 s", value: 60 },
  { label: "Full song", value: null },
];
const DEVICES = [
  { label: "Auto", value: "auto", hint: "GPU (CUDA) if the server has one, else CPU" },
  { label: "CPU", value: "cpu", hint: "Always use the CPU" },
];

const label = (k: StemKey) => k[0].toUpperCase() + k.slice(1);

type Phase = "idle" | "uploading" | "running" | "done" | "error";

/* ---------- Small pieces ---------- */

function Segmented<T extends string | number | null>({
  options,
  value,
  onChange,
  disabled,
  id,
}: {
  options: { label: string; value: T; hint?: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  id: string;
}) {
  return (
    <div role="radiogroup" className={`flex flex-wrap gap-1 rounded-full border border-white/[.08] bg-white/[.02] p-1 ${disabled ? "opacity-40" : ""}`}>
      {options.map((o) => {
        const on = o.value === value;
        const button = (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={`relative h-8 rounded-full px-3.5 text-xs transition-colors ${on ? "text-on-accent" : "text-paper/55 hover:text-paper"}`}
          >
            {on && (
              <motion.span layoutId={`seg-${id}`} transition={spring} className="absolute inset-0 rounded-full bg-paper" />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
        return o.hint ? (
          <Tooltip key={String(o.value)} title={o.hint} describeChild>
            {button}
          </Tooltip>
        ) : (
          button
        );
      })}
    </div>
  );
}

function Setting({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[.2em] text-paper/40">
        {icon}
        {title}
      </span>
      {children}
    </div>
  );
}

function Dropzone({ onFile, error }: { onFile: (f?: File) => void; error: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <motion.div
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
        onFile(e.dataTransfer.files[0]);
      }}
      onClick={() => input.current?.click()}
      animate={{ scale: drag ? 1.015 : 1 }}
      whileHover="hover"
      transition={spring}
      className={`group relative cursor-pointer overflow-hidden rounded-[28px] border border-dashed px-6 py-16 text-center transition-colors duration-500 sm:py-20 ${drag ? "border-iris/70 bg-iris/[.07]" : error ? "border-danger/40 bg-danger/[.04]" : "border-white/15 bg-white/[.015] hover:bg-white/[.035]"}`}
    >
      <input
        ref={input}
        type="file"
        accept="audio/*,.wav,.mp3,.aif,.aiff,.flac,.m4a,.aac,.ogg"
        className="sr-only"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <motion.span
        variants={{ hover: { y: -4, rotate: -6 } }}
        transition={spring}
        className={`relative mx-auto grid size-16 place-items-center rounded-2xl transition-colors duration-300 ${drag ? "bg-spectrum text-on-accent" : "glass text-paper/70 group-hover:text-paper"}`}
      >
        <Upload size={24} />
      </motion.span>
      <p className="relative mt-7 text-xl font-medium tracking-[-.02em] text-paper/85">
        {drag ? (
          <>
            Let it <Serif spectrum>go.</Serif>
          </>
        ) : (
          <>
            Drop a song here, or{" "}
            <span className="text-spectrum underline decoration-white/20 underline-offset-[6px]">browse</span>
          </>
        )}
      </p>
      <p className="relative mt-3 font-mono text-[11px] uppercase tracking-[.18em] text-paper/30">
        MP3 · WAV · FLAC · M4A · AIFF — 10 s to 10 min, up to 100 MB
      </p>
    </motion.div>
  );
}

function Progress({ job, startedAt, audioSeconds, uploading }: { job: StemJob | null; startedAt: number; audioSeconds: number; uploading: boolean }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);
  const elapsed = (now - startedAt) / 1000;
  const estimate = estimateSeconds(audioSeconds);
  const pct = Math.min(95, (elapsed / estimate) * 100);
  const over = elapsed > estimate * 1.3;

  return (
    <div className="glass relative overflow-hidden rounded-[28px] bg-ink-2/40 p-6 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <Eyebrow icon={<EqBars count={3} className="h-3 text-mint" barClassName="w-[2px]" />}>
            {uploading ? "Uploading" : "Separating with htdemucs_6s"}
          </Eyebrow>
          <p className="mt-4 truncate text-2xl font-medium tracking-[-.03em] text-paper/90">{job?.fileName ?? "…"}</p>
        </div>
        <p className="text-right">
          <Num value={Math.floor(elapsed)} suffix=" s" className="text-4xl font-semibold tracking-[-.04em]" />
          <span className="mt-1 block font-mono text-[11px] text-paper/40">
            {over ? "taking longer than usual" : `≈ ${Math.round(estimate)} s on an M3 Pro CPU`}
          </span>
        </p>
      </div>

      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/[.06]">
        <motion.div
          className="h-full rounded-full bg-spectrum"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "linear" }}
        />
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {STEM_KEYS.map((k, i) => {
          const c = stemColor[label(k)];
          return (
            <motion.div
              key={k}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.2 }}
              className="flex items-center gap-2 rounded-2xl border border-white/[.06] bg-white/[.02] px-3 py-2.5 text-xs text-paper/70"
            >
              <span style={{ color: c }} className="inline-flex">
                <IconFor stem={label(k)} size={14} />
              </span>
              {label(k)}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Mixer ---------- */

function Mixer({ job, file, onDiscard }: { job: StemJob; file: File | null; onDiscard: () => void }) {
  const sources = useMemo<PlayerSource[]>(() => {
    const list: PlayerSource[] = STEM_KEYS.map((k) => ({ key: k, data: job.stems![k] }));
    if (file) list.push({ key: "original", data: file });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);
  const player = useStemPlayer(sources);
  const { toggle } = player;
  const [mode, setMode] = useState<"stems" | "original">("stems");
  const [vol, setVol] = useState<Record<StemKey, number>>({ vocals: 80, drums: 80, bass: 80, guitar: 80, piano: 80, other: 80 });
  const [muted, setMuted] = useState<StemKey[]>([]);
  const [solo, setSolo] = useState<StemKey | null>(null);
  const audible = (k: StemKey) => (solo ? solo === k : !muted.includes(k));
  const hasOriginal = player.ready && player.tracks.some((t) => t.key === "original");
  const stemsFailed = player.failed.filter((k) => k !== "original");

  // Playhead as a percentage, read from the audio clock every frame.
  const head = useMotionValue(0);
  useAnimationFrame(() => {
    if (player.duration) head.set((player.position() / player.duration) * 100);
  });
  const timecode = useTransform(head, (v) => formatTime((v / 100) * player.duration));

  useEffect(() => {
    if (!player.ready) return;
    const gains: Record<string, number> = { original: mode === "original" ? 1 : 0 };
    for (const k of STEM_KEYS) gains[k] = mode === "stems" && audible(k) ? vol[k] / 100 : 0;
    player.setGains(gains);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.ready, player.setGains, vol, muted, solo, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.code === "Space" && !el.closest("input,button,[role=slider]")) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const base = job.fileName.replace(/\.[^.]+$/, "");
  const seekPct = (p: number) => player.seek((p / 100) * player.duration);

  return (
    <>
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="glass rounded-[28px] bg-ink-2/40 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Eyebrow icon={<SlidersHorizontal size={13} className="text-iris" />}>Stem mixer</Eyebrow>
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {mode === "stems" && (solo || muted.length > 0) && (
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
              {hasOriginal && (
                <Segmented
                  id="ab"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { label: "Stems", value: "stems", hint: "Hear your mix of the six stems" },
                    { label: "Original", value: "original", hint: "A/B against the song you uploaded" },
                  ]}
                />
              )}
            </div>
          </div>

          {!player.ready ? (
            <div className="mt-8">
              <p className="font-mono text-xs text-paper/45">
                Loading stems into the mixer… {player.loaded}/{player.total}
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/[.06]">
                <motion.div
                  className="h-full rounded-full bg-spectrum"
                  animate={{ width: `${(player.loaded / Math.max(1, player.total)) * 100}%` }}
                  transition={spring}
                />
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-1">
              {stemsFailed.length > 0 && (
                <p role="alert" className="mb-3 flex items-center gap-2 text-sm text-danger">
                  <CircleAlert size={15} /> Couldn't load: {stemsFailed.join(", ")}
                </p>
              )}
              {STEM_KEYS.map((k) => {
                const track = player.tracks.find((t) => t.key === k);
                if (!track) return null;
                const name = label(k);
                const c = stemColor[name];
                const on = mode === "stems" && audible(k);
                const isMuted = muted.includes(k);
                return (
                  <div
                    key={k}
                    className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-2 rounded-2xl px-2 py-2 transition-colors hover:bg-white/[.025] sm:grid-cols-[8.5rem_1fr_9rem_auto]"
                  >
                    <motion.div animate={{ opacity: on ? 1 : 0.4 }} className="flex items-center gap-3">
                      <motion.span
                        animate={{ scale: solo === k ? 1.2 : 1 }}
                        transition={bouncy}
                        className="grid size-8 shrink-0 place-items-center rounded-xl"
                        style={{ background: alpha(c, on ? 0.14 : 0.05), color: on ? c : "rgba(244,241,234,.4)" }}
                      >
                        <IconFor stem={name} size={14} />
                      </motion.span>
                      <span className="flex items-center gap-1.5 text-xs text-paper/75">
                        {name}
                        {player.isPlaying && on && (
                          <span style={{ color: c }}>
                            <EqBars count={3} className="h-2" barClassName="w-[2px]" />
                          </span>
                        )}
                        {k === "piano" && (
                          <Tooltip title="htdemucs_6s's piano stem is its weakest: expect bleed from guitar/keys/synths, or near silence. Don't trust it on its own.">
                            <span className="inline-flex cursor-help text-paper/35 hover:text-paper/70">
                              <Info size={12} />
                            </span>
                          </Tooltip>
                        )}
                      </span>
                    </motion.div>

                    <motion.div
                      animate={{ opacity: on ? 1 : 0.35 }}
                      className="col-span-3 row-start-2 min-w-0 sm:col-span-1 sm:row-start-auto"
                    >
                      <Waveform
                        compact
                        framed={false}
                        bars={track.peaks}
                        start={0}
                        end={100}
                        color={c}
                        duration={player.duration}
                        playhead={head}
                        onSeek={seekPct}
                      />
                    </motion.div>

                    <Slider
                      aria-label={`${name} volume`}
                      value={vol[k]}
                      disabled={!on}
                      valueLabelDisplay="auto"
                      onChange={(_, v) => setVol((cur) => ({ ...cur, [k]: v as number }))}
                      style={{ "--slider-fill": c, "--slider-glow": alpha(c, 0.55) } as CSSProperties}
                      className="hidden min-w-0 sm:block"
                    />

                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip title={isMuted ? "Unmute" : "Mute"}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.8 }}
                          disabled={mode !== "stems"}
                          aria-label={`${isMuted ? "Unmute" : "Mute"} ${name}`}
                          aria-pressed={isMuted}
                          onClick={() => setMuted((m) => (m.includes(k) ? m.filter((x) => x !== k) : [...m, k]))}
                          animate={{
                            backgroundColor: isMuted ? "rgba(255,138,138,.15)" : "rgba(255,255,255,0)",
                            color: isMuted ? "#ff8a8a" : "rgba(244,241,234,.4)",
                          }}
                          className="grid size-8 place-items-center rounded-full hover:text-paper disabled:opacity-40"
                        >
                          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </motion.button>
                      </Tooltip>
                      <Tooltip title={solo === k ? "Unsolo" : "Solo"}>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.8 }}
                          disabled={mode !== "stems"}
                          aria-label={`Solo ${name}`}
                          aria-pressed={solo === k}
                          onClick={() => setSolo((x) => (x === k ? null : k))}
                          animate={{
                            backgroundColor: solo === k ? c : alpha(c, 0),
                            color: solo === k ? "#0a0a0f" : "rgba(244,241,234,.4)",
                          }}
                          className="grid size-8 place-items-center rounded-full font-mono text-[11px] font-semibold hover:text-paper disabled:opacity-40"
                        >
                          S
                        </motion.button>
                      </Tooltip>
                      <Tooltip title={`Download ${name}.wav`}>
                        <a
                          href={job.stems![k]}
                          download={`${base} - ${name}.wav`}
                          aria-label={`Download ${name}`}
                          className="grid size-8 place-items-center rounded-full text-paper/40 transition-colors hover:bg-white/[.06] hover:text-paper"
                        >
                          <Download size={14} />
                        </a>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.p variants={fadeUp} className="flex items-start gap-2 px-2 text-xs leading-5 text-paper/35">
          <Info size={13} className="mt-0.5 shrink-0" />
          Stems are 16-bit WAVs at the song's sample rate. They're deleted from the server when you leave this page,
          start a new track, or after an hour.
        </motion.p>
      </motion.div>

      {/* ActionBar animates via inherited variants; the mixer mounts after the
          page's enter animation, so give it its own hidden -> show trigger. */}
      <motion.div initial="hidden" animate="show">
      <ActionBar width="max-w-4xl">
        <div className="flex items-center gap-3 p-2.5 pl-3 sm:gap-4 sm:pl-4">
          <PlayButton
            playing={player.isPlaying}
            onClick={player.toggle}
            disabled={!player.ready}
            label={player.isPlaying ? "Pause" : "Play"}
            size={46}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-paper/85">{job.fileName}</p>
            <p className="mt-0.5 font-mono text-[11px] tabular-nums text-paper/40">
              <motion.span>{timecode}</motion.span> / {formatTime(player.duration)}
              <span className="hidden sm:inline">
                {" "}· {mode === "original" ? "original" : solo ? `solo ${solo}` : `${STEM_KEYS.filter(audible).length}/6 stems`}
              </span>
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-white/[.07] bg-white/[.03] px-3 py-1.5 font-mono text-[11px] text-paper/55 md:flex">
            <Headphones size={12} className="text-mint" />
            {job.runtimeSeconds?.toFixed(1)} s on {job.device}
            {job.clipSeconds ? ` · ${job.clipSeconds} s clip` : ""}
          </span>
          <Tooltip title="Delete these stems and separate another song" describeChild>
            <motion.button {...press} type="button" onClick={onDiscard} className={`${btn.secondary} px-4 sm:px-5`}>
              <Trash2 size={15} />
              <span className="hidden sm:inline">New song</span>
            </motion.button>
          </Tooltip>
        </div>
      </ActionBar>
      </motion.div>
    </>
  );
}

/* ---------- Page ---------- */

export default function StemsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileSeconds, setFileSeconds] = useState(0);
  const [clip, setClip] = useState<number | null>(30);
  const [device, setDevice] = useState("auto");
  const [phase, setPhase] = useState<Phase>("idle");
  const [job, setJob] = useState<StemJob | null>(null);
  const [error, setError] = useState<{ type: string; message: string } | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const jobId = useRef<string | null>(null);

  // User audio shouldn't outlive the session: drop the server copy on leave.
  useEffect(() => {
    const drop = () => {
      if (jobId.current) void deleteSeparation(jobId.current);
      jobId.current = null;
    };
    window.addEventListener("pagehide", drop);
    return () => {
      window.removeEventListener("pagehide", drop);
      drop();
    };
  }, []);

  // Poll the running job.
  useEffect(() => {
    if (phase !== "running" || !job) return;
    const t = setInterval(async () => {
      try {
        const next = await getSeparation(job.id);
        if (next.status === "done") {
          setJob(next);
          setPhase("done");
        } else if (next.status === "error") {
          setError(next.error ?? { type: "Error", message: "Separation failed" });
          setPhase("error");
          jobId.current = null;
          void deleteSeparation(next.id);
        }
      } catch (e) {
        setError({ type: e instanceof StemApiError ? e.type : "Error", message: (e as Error).message });
        setPhase("error");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, job]);

  const discardJob = () => {
    if (jobId.current) void deleteSeparation(jobId.current);
    jobId.current = null;
    setJob(null);
  };

  const selectFile = (f?: File) => {
    if (!f) return;
    setError(null);
    if (!f.type.startsWith("audio/") && !AUDIO_EXT.test(f.name))
      return setError({ type: "UnsupportedAudio", message: `"${f.name}" isn't an audio file. Try MP3, WAV, FLAC, M4A or AIFF.` });
    if (f.size > MAX_BYTES)
      return setError({ type: "TooLarge", message: `That file is ${formatBytes(f.size)}. The limit is 100 MB.` });
    discardJob();
    setPhase("idle");
    setFile(f);
    setFileSeconds(0);
    // Duration from metadata only; the server does the real validation.
    const url = URL.createObjectURL(f);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      if (Number.isFinite(a.duration)) setFileSeconds(a.duration);
      URL.revokeObjectURL(url);
    };
    a.onerror = () => URL.revokeObjectURL(url);
    a.src = url;
  };

  const clear = () => {
    discardJob();
    setFile(null);
    setFileSeconds(0);
    setError(null);
    setPhase("idle");
  };

  const effectiveSeconds = fileSeconds ? (clip ? Math.min(clip, fileSeconds) : fileSeconds) : clip ?? 180;
  const lengthProblem =
    fileSeconds && effectiveSeconds < MIN_SECONDS
      ? `This song is only ${fileSeconds.toFixed(1)} s. Stems need at least ${MIN_SECONDS} s.`
      : fileSeconds && effectiveSeconds > MAX_SECONDS
        ? `Full songs over 10 minutes aren't supported. Pick a clip length instead.`
        : null;

  const separate = async () => {
    if (!file) return;
    setError(null);
    setPhase("uploading");
    setStartedAt(Date.now());
    try {
      const started = await startSeparation(file, { clipSeconds: clip, device });
      jobId.current = started.id;
      setJob(started);
      setPhase("running");
    } catch (e) {
      setError({ type: e instanceof StemApiError ? e.type : "Error", message: (e as Error).message });
      setPhase("error");
    }
  };

  const cancel = () => {
    discardJob();
    setPhase("idle");
  };

  const busy = phase === "uploading" || phase === "running";
  const canStart = !!file && !busy && phase !== "done" && !lengthProblem;

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pb-44 pt-10 sm:px-8 sm:pt-14">
        <motion.div variants={stagger(0.08, 0.05)} className="grid gap-10 lg:grid-cols-[1fr_.9fr] lg:items-end lg:gap-16">
          <div>
            <motion.div variants={fadeUp}>
              <Eyebrow>Stem separator</Eyebrow>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              className="mt-5 text-5xl font-semibold leading-[.95] tracking-[-.06em] sm:text-6xl"
            >
              Pull it <Serif spectrum>apart.</Serif>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-md leading-7 text-paper/50">
              Split any song into vocals, drums, bass, guitar, piano and everything else, then balance, solo and
              A/B the stems right here.
            </motion.p>
          </div>

          <motion.div variants={fadeUp} className="glass space-y-5 rounded-[26px] bg-ink-2/40 p-5 sm:p-6">
            <Setting icon={<Scissors size={12} />} title="Length">
              <Segmented id="len" options={LENGTHS} value={clip} onChange={setClip} disabled={busy || phase === "done"} />
            </Setting>
            <Setting icon={<Cpu size={12} />} title="Device">
              <Segmented id="dev" options={DEVICES} value={device} onChange={setDevice} disabled={busy || phase === "done"} />
            </Setting>
            <p className="flex items-center justify-between gap-3 border-t border-white/[.06] pt-4 font-mono text-[11px] text-paper/35">
              <span className="flex items-center gap-1.5">
                <AudioLines size={12} /> htdemucs_6s · 6 stems
              </span>
              <span>≈ {Math.round(estimateSeconds(effectiveSeconds))} s on CPU</span>
            </p>
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-12">
          <AnimatePresence mode="wait" initial={false}>
            {phase === "done" && job?.stems ? (
              <motion.div key="mixer" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: easeOutExpo }}>
                <Mixer key={job.id} job={job} file={file} onDiscard={clear} />
              </motion.div>
            ) : busy ? (
              <motion.div key="progress" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={spring}>
                <Progress job={job} startedAt={startedAt} audioSeconds={effectiveSeconds} uploading={phase === "uploading"} />
              </motion.div>
            ) : file ? (
              <motion.div
                key="file"
                initial={{ opacity: 0, scale: 0.97, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={spring}
                className="glass flex items-center gap-4 rounded-[28px] bg-ink-2/50 p-4 sm:p-5"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[.05] text-paper/70">
                  <FileAudio size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-paper/90">{file.name}</p>
                  <p className="mt-1 flex items-center gap-2 font-mono text-[11px] text-paper/35">
                    <span className="uppercase">{file.name.split(".").pop()}</span>
                    <span>·</span>
                    <span>{formatBytes(file.size)}</span>
                    {fileSeconds > 0 && (
                      <>
                        <span>·</span>
                        <span>{formatTime(fileSeconds)}</span>
                      </>
                    )}
                  </p>
                </div>
                <Tooltip title="Remove">
                  <motion.button
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.85 }}
                    transition={spring}
                    type="button"
                    onClick={clear}
                    aria-label="Remove file"
                    className="grid size-10 place-items-center rounded-full text-paper/45 transition-colors hover:bg-white/[.06] hover:text-paper"
                  >
                    <X size={16} />
                  </motion.button>
                </Tooltip>
              </motion.div>
            ) : (
              <motion.div key="drop" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={spring}>
                <Dropzone onFile={selectFile} error={!!error} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(error || lengthProblem) && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={spring}
                className="overflow-hidden"
              >
                <p className="flex items-start gap-2 text-sm text-danger">
                  <CircleAlert size={15} className="mt-0.5 shrink-0" />
                  <span>
                    {error ? (
                      <>
                        <span className="font-mono text-xs opacity-70">{error.type}</span> {error.message}
                      </>
                    ) : (
                      lengthProblem
                    )}
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      {phase !== "done" && (
        <ActionBar>
          <div className="flex items-center gap-4 p-2.5 pl-4">
            <p className="hidden min-w-0 flex-1 truncate text-sm text-paper/50 sm:block">
              {busy
                ? "Demucs is working. You can keep this tab in the background."
                : file
                  ? `${clip ? `First ${Math.round(effectiveSeconds)} s` : "Full song"} · ${device === "auto" ? "auto device" : "CPU"}`
                  : "Choose a song to separate"}
            </p>
            {busy ? (
              <motion.button {...press} type="button" onClick={cancel} className={`${btn.secondary} w-full sm:w-auto`}>
                <X size={16} /> Cancel
              </motion.button>
            ) : (
              <motion.button
                {...(canStart ? press : {})}
                type="button"
                disabled={!canStart}
                onClick={separate}
                className={`${btn.primary} w-full sm:w-auto sm:px-7 ${canStart ? "before:opacity-60" : ""}`}
              >
                {phase === "error" ? <RotateCcw size={16} /> : <Split size={16} />}
                {phase === "error" ? "Try again" : "Separate stems"}
              </motion.button>
            )}
          </div>
        </ActionBar>
      )}
    </>
  );
}
