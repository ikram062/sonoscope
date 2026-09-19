"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Disc3,
  FileAudio,
  GripVertical,
  Library as LibraryIcon,
  Mic2,
  Pause,
  Piano,
  Play,
  Save,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Waves,
  Drum,
  Guitar,
  Music2,
} from "lucide-react";

const genres = ["Hip-Hop", "R&B", "Lo-Fi", "Pop", "Electronic", "Other"];
const stems = ["Vocals", "Drums", "Bass", "Guitar", "Piano", "Other"];
const fakeLibrary = [
  {
    title: "midnight-drive.wav",
    genre: "Hip-Hop",
    loop: "00:42 — 01:31",
    color: "#c4ff55",
  },
  {
    title: "velvet-room.mp3",
    genre: "R&B",
    loop: "01:18 — 02:07",
    color: "#e0a7ff",
  },
  {
    title: "rainy-window.aiff",
    genre: "Lo-Fi",
    loop: "00:24 — 01:13",
    color: "#71d8ff",
  },
  {
    title: "neon-signal.wav",
    genre: "Electronic",
    loop: "02:02 — 02:51",
    color: "#ffb75e",
  },
];
const fallbackWave = Array.from({ length: 96 }, (_, i) => 24 + ((i * 37) % 64));

function Logo() {
  return (
    <a href="/" className="flex items-center gap-2.5 text-white">
      <span className="grid size-9 place-items-center rounded-xl bg-[#c4ff55] text-[#11160f]">
        <Disc3 size={20} />
      </span>
      <span className="text-[15px] font-semibold tracking-[-.03em]">
        sonoscope
      </span>
    </a>
  );
}
function Nav() {
  return (
    <header className="border-b border-white/[.07] bg-[#0c100d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 text-sm">
          <a
            className="rounded-lg px-3 py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
            href="/upload"
          >
            New analysis
          </a>
          <a
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-white/45 transition hover:bg-white/5 hover:text-white"
            href="/library"
          >
            <LibraryIcon size={15} /> Library
          </a>
        </nav>
      </div>
    </header>
  );
}
function Waveform({
  start = 30,
  end = 66,
  bars = fallbackWave,
  editable = false,
  onStart,
  onEnd,
}: {
  start?: number;
  end?: number;
  bars?: number[];
  editable?: boolean;
  onStart?: (v: number) => void;
  onEnd?: (v: number) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#151b15] p-5 sm:p-7">
      <div
        className="absolute inset-y-0 bg-[#c4ff55]/10"
        style={{ left: `${start}%`, width: `${end - start}%` }}
      />
      <div className="relative flex h-28 items-center gap-[3px]">
        {bars.map((h, i) => {
          const p = (i / bars.length) * 100;
          const active = p >= start && p <= end;
          return (
            <span
              key={i}
              className={`w-full rounded-full ${active ? "bg-[#c4ff55]" : "bg-white/20"}`}
              style={{ height: `${h}%`, opacity: active ? 0.95 : 0.65 }}
            />
          );
        })}
      </div>
      {editable && (
        <>
          <div className="absolute top-1/2 z-10" style={{ left: `${start}%` }}>
            <div className="grid h-36 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-[#c4ff55] shadow-[0_0_24px_#c4ff5566]">
              <GripVertical size={14} className="text-[#11160f]" />
            </div>
          </div>
          <div className="absolute top-1/2 z-10" style={{ left: `${end}%` }}>
            <div className="grid h-36 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-[#c4ff55] shadow-[0_0_24px_#c4ff5566]">
              <GripVertical size={14} className="text-[#11160f]" />
            </div>
          </div>
          <input
            aria-label="Loop start"
            type="range"
            min="8"
            max={end - 8}
            value={start}
            onChange={(e) => onStart?.(+e.target.value)}
          />
          <input
            aria-label="Loop end"
            type="range"
            min={start + 8}
            max="92"
            value={end}
            onChange={(e) => onEnd?.(+e.target.value)}
          />
        </>
      )}
      <div className="mt-4 flex justify-between text-[10px] uppercase tracking-[.2em] text-white/30">
        <span>00:00</span>
        <span>02:48</span>
        <span>04:32</span>
      </div>
    </div>
  );
}
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0c100d] text-white selection:bg-[#c4ff55] selection:text-black">
      <Nav />
      {children}
    </main>
  );
}
function IconFor({ stem }: { stem: string }) {
  return stem === "Vocals" ? (
    <Mic2 size={16} />
  ) : stem === "Drums" ? (
    <Drum size={16} />
  ) : stem === "Guitar" ? (
    <Guitar size={16} />
  ) : stem === "Piano" ? (
    <Piano size={16} />
  ) : (
    <Music2 size={16} />
  );
}

function Landing() {
  return (
    <Shell>
      <section className="mx-auto grid max-w-6xl gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:py-28">
        <div>
          <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.22em] text-[#c4ff55]">
            <Sparkles size={14} /> AI-powered sample discovery
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-[-.07em] sm:text-7xl">
            Find the moment
            <br />
            <span className="text-white/35">worth looping.</span>
          </h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-white/45">
            Sonoscope listens to your track, finds the most repeatable pocket,
            and gives you a loop you can actually use.
          </p>
          <a
            href="/upload"
            className="mt-9 inline-flex h-13 items-center gap-3 rounded-xl bg-[#c4ff55] px-6 text-sm font-semibold text-[#11160f] transition hover:bg-[#d7ff88]"
          >
            Try it free <ArrowRight size={17} />
          </a>
          <p className="mt-4 text-xs text-white/25">
            No account required · WAV, MP3, AIFF
          </p>
        </div>
        <div className="relative rounded-[28px] border border-white/10 bg-[#121812] p-5 shadow-2xl shadow-black/30 sm:p-7">
          <div className="mb-7 flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-white/45">
              <span className="size-2 rounded-full bg-[#c4ff55]" /> ANALYSIS
              COMPLETE
            </span>
            <span className="text-xs text-white/25">04:32</span>
          </div>
          <Waveform />
          <div className="mt-5 rounded-xl border border-[#c4ff55]/20 bg-[#c4ff55]/[.07] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#c4ff55]">
              <Sparkles size={14} /> AI PICKED THIS
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">
              A 4-bar drum pocket with a clean transient and satisfying swing.
            </p>
          </div>
        </div>
      </section>
      <section className="border-t border-white/[.07] bg-[#10150f]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
          <p className="text-xs uppercase tracking-[.2em] text-[#c4ff55]">
            How it works
          </p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {[
              [
                "01",
                "Upload your track",
                "Drop in a song and choose the genre you are making for.",
              ],
              [
                "02",
                "Let it listen",
                "Sonoscope maps the energy, repetition, and stem balance.",
              ],
              [
                "03",
                "Take the loop",
                "Edit the range, mute stems, and export your favorite pocket.",
              ],
            ].map(([n, t, d]) => (
              <div key={n} className="border-t border-white/10 pt-5">
                <span className="font-mono text-xs text-[#c4ff55]">{n}</span>
                <h2 className="mt-8 text-xl font-medium">{t}</h2>
                <p className="mt-3 text-sm leading-6 text-white/40">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Shell>
  );
}

function UploadPage() {
const navigate = useNavigate()
  const [genre, setGenre] = useState("Hip-Hop");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [bars, setBars] = useState<number[]>(fallbackWave);
  const input = useRef<HTMLInputElement>(null);
  const selectFile = (f?: File) => {
    if (!f) return;
    setFile(f);
    const ctx = new AudioContext();
    f.arrayBuffer()
      .then((b) => ctx.decodeAudioData(b))
      .then((a) => {
        const data = a.getChannelData(0),
          step = Math.max(1, Math.floor(data.length / 96));
        setBars(
          Array.from({ length: 96 }, (_, i) => {
            let max = 0;
            for (let j = i * step; j < (i + 1) * step && j < data.length; j++)
              max = Math.max(max, Math.abs(data[j]));
            return Math.max(12, Math.min(100, max * 210));
          }),
        );
      })
      .catch(() => {});
  };
  return (
    <Shell>
      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[.22em] text-[#c4ff55]">
          New analysis
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.06em] sm:text-6xl">
          What are you making?
        </h1>
        <p className="mt-4 text-white/40">
          Choose a direction, then give Sonoscope something to listen to.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`flex h-16 items-end rounded-xl border p-4 text-left text-sm transition ${genre === g ? "border-[#c4ff55] bg-[#c4ff55]/10 text-[#d9ff9a]" : "border-white/10 bg-white/[.03] text-white/55 hover:border-white/25"}`}
            >
              {g}
              {genre === g && (
                <Check size={15} className="ml-auto self-start" />
              )}
            </button>
          ))}
        </div>
        <div
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
          className={`mt-8 cursor-pointer rounded-2xl border border-dashed p-10 text-center transition ${drag ? "border-[#c4ff55] bg-[#c4ff55]/10" : "border-white/15 bg-white/[.025] hover:border-white/30"}`}
        >
          <input
            ref={input}
            type="file"
            accept="audio/*"
            className="sr-only"
            onChange={(e) => selectFile(e.target.files?.[0])}
          />
          {file ? (
            <>
              <FileAudio className="mx-auto text-[#c4ff55]" size={30} />
              <p className="mt-4 text-sm text-white/80">{file.name}</p>
              <p className="mt-1 text-xs text-white/30">
                Ready to analyze · click to replace
              </p>
              <div className="mt-6">
                <Waveform bars={bars} start={0} end={100} />
              </div>
            </>
          ) : (
            <>
              <Upload className="mx-auto text-white/50" size={28} />
              <p className="mt-4 text-sm text-white/75">
                Drop your track here or{" "}
                <span className="text-[#c4ff55]">browse files</span>
              </p>
              <p className="mt-2 text-xs text-white/30">
                WAV, MP3 or AIFF · up to 100MB
              </p>
            </>
          )}
        </div>
        <button
          disabled={!file}
          onClick={() => navigate("/processing")}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#c4ff55] text-sm font-semibold text-[#11160f] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Analyze track <ArrowRight size={17} />
        </button>
      </section>
    </Shell>
  );
}

function Processing() {
const navigate = useNavigate()
  const [p, setP] = useState(8);
  useEffect(() => {
    fetch("/api/analyze", { method: "POST" }).catch(() => {});
    const id = setInterval(
      () =>
        setP((v) => {
          if (v >= 92) {
            clearInterval(id);
            navigate("/result/sonoscope-demo");
            return 100;
          }
          return Math.min(99, v + 7);
        }),
      260,
    );
    return () => clearInterval(id);
  }, [navigate]);
  const status =
    p < 35
      ? "Analyzing stems..."
      : p < 70
        ? "Finding the loop..."
        : "Checking against Hip-Hop patterns...";
  return (
    <Shell>
      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-3xl flex-col items-center justify-center px-5 text-center">
        <div className="grid size-20 place-items-center rounded-3xl border border-[#c4ff55]/25 bg-[#c4ff55]/10 text-[#c4ff55] animate-pulse">
          <Waves size={35} />
        </div>
        <p className="mt-9 text-xs font-semibold uppercase tracking-[.22em] text-[#c4ff55]">
          Sonoscope is listening
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-.06em]">
          Building your analysis.
        </h1>
        <p className="mt-4 text-white/40">{status}</p>
        <div className="mt-10 h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#c4ff55] transition-all duration-300"
            style={{ width: `${p}%` }}
          />
        </div>
        <span className="mt-3 font-mono text-xs text-white/25">{p}%</span>
      </section>
    </Shell>
  );
}

function Result({ edit = false }: { edit?: boolean }) {
const navigate = useNavigate()
  const [playing, setPlaying] = useState(false);
  const [start, setStart] = useState(30);
  const [end, setEnd] = useState(66);
  const [genre, setGenre] = useState("Hip-Hop");
  const [selected, setSelected] = useState(["Drums", "Bass"]);
  const [vol, setVol] = useState<Record<string, number>>({
    Vocals: 70,
    Drums: 86,
    Bass: 78,
    Guitar: 58,
    Piano: 46,
    Other: 32,
  });
  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.2em] text-[#c4ff55]">
              <Sparkles size={14} />{" "}
              {edit ? "Loop editor" : "Analysis complete"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-[-.06em] sm:text-6xl">
              {edit ? "Dial in the pocket." : "We found your moment."}
            </h1>
            <p className="mt-4 text-white/40">
              {edit
                ? "Shape the moment until it feels right."
                : "One loop stood out from the rest of the track."}
            </p>
          </div>
          {!edit && (
            <button
              onClick={() => setPlaying(!playing)}
              className="grid size-14 place-items-center rounded-full bg-[#c4ff55] text-[#11160f]"
            >
              {playing ? (
                <Pause fill="currentColor" />
              ) : (
                <Play fill="currentColor" />
              )}
            </button>
          )}
        </div>
        <div className="mt-10">
          <Waveform
            editable={edit}
            start={start}
            end={end}
            onStart={(v) => setStart(Math.min(v, end - 8))}
            onEnd={(v) => setEnd(Math.max(v, start + 8))}
          />
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/35">
          <span>Loop 01 · 4 bars · 92 BPM</span>
          <span className="rounded-full bg-white/[.06] px-3 py-1.5 text-white/50">
            00:42 — 01:31
          </span>
        </div>
        <div className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-2xl border border-[#c4ff55]/20 bg-[#c4ff55]/[.07] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-[#c4ff55]">
              <Sparkles size={14} /> Why this loop
            </div>
            <p className="mt-4 text-lg leading-8 text-white/80">
              This section repeats 6 times and has a clean isolated drum pattern
              with a satisfying pocket — a strong {genre} pick.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {stems.map((s) => (
                <span
                  key={s}
                  className={`rounded-full border px-2.5 py-1 text-[11px] ${selected.includes(s) ? "border-[#c4ff55]/30 bg-[#c4ff55]/10 text-[#d9ff9a]" : "border-white/10 text-white/25"}`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#121812] p-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <SlidersHorizontal size={16} className="text-[#c4ff55]" /> Mixer
            </div>
            {stems.map((s) => (
              <div key={s} className="mt-5 flex items-center gap-3">
                <button
                  aria-label={`Toggle ${s}`}
                  onClick={() =>
                    setSelected((x) =>
                      x.includes(s) ? x.filter((y) => y !== s) : [...x, s],
                    )
                  }
                  className="text-white/45"
                >
                  <IconFor stem={s} />
                </button>
                <span className="w-14 text-xs text-white/55">{s}</span>
                <input
                  aria-label={`${s} volume`}
                  className="h-1 flex-1 accent-[#c4ff55]"
                  type="range"
                  value={vol[s]}
                  onChange={(e) => setVol({ ...vol, [s]: +e.target.value })}
                />
                <span className="w-6 text-right font-mono text-[10px] text-white/25">
                  {vol[s]}
                </span>
              </div>
            ))}
          </div>
        </div>
        {edit && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#121812] p-5">
            <button className="flex items-center gap-2 text-xs text-white/45">
              Switch genre{" "}
              <span className="flex items-center gap-1 rounded-md bg-white/[.06] px-2 py-1 text-white/70">
                {genre}
                <ChevronDown size={13} />
              </span>
            </button>
            <div className="flex gap-2">
              {genres.slice(0, 3).map((g) => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`rounded-lg px-3 py-2 text-xs ${genre === g ? "bg-[#c4ff55] text-[#11160f]" : "bg-white/[.05] text-white/45"}`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={() =>
              navigate(
                edit ? "/result/sonoscope-demo" : "/result/sonoscope-demo/edit",
              )
            }
            className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-sm text-white/65 hover:bg-white/[.05]"
          >
            {edit ? "Cancel" : "Adjust loop"}
          </button>
          <button
            onClick={() => navigate("/library")}
            className="flex h-12 items-center gap-2 rounded-xl bg-[#c4ff55] px-5 text-sm font-semibold text-[#11160f]"
          >
            <Save size={16} />
            {edit ? "Save loop" : "Save to library"}
          </button>
        </div>
      </section>
    </Shell>
  );
}

function Library() {
  return (
    <Shell>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#c4ff55]">
              Your collection
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-[-.07em]">
              Library
            </h1>
            <p className="mt-4 text-white/40">
              Past analyses and loops you decided to keep.
            </p>
          </div>
          <a
            href="/upload"
            className="hidden items-center gap-2 rounded-xl bg-[#c4ff55] px-4 py-3 text-sm font-semibold text-[#11160f] sm:flex"
          >
            <Upload size={16} /> New analysis
          </a>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fakeLibrary.map((item, i) => (
            <article
              key={item.title}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-[#121812] transition hover:-translate-y-1 hover:border-white/20"
            >
              <div
                className="flex h-36 items-center justify-center p-5"
                style={{
                  background: `linear-gradient(135deg, ${item.color}18, transparent)`,
                }}
              >
                <Waveform
                  bars={fallbackWave.slice(i * 8, i * 8 + 64)}
                  start={30}
                  end={66}
                />
              </div>
              <div className="border-t border-white/[.07] p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="truncate text-sm font-medium text-white/80">
                    {item.title}
                  </h2>
                  <button className="grid size-8 place-items-center rounded-full bg-white/[.06] text-white/60">
                    <Play size={13} fill="currentColor" />
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="rounded-full bg-white/[.06] px-2.5 py-1 text-white/45">
                    {item.genre}
                  </span>
                  <span className="font-mono text-white/30">{item.loop}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </Shell>
  );
}

export default function SonoscopeApp() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  if (pathname === "/") return <Landing />;
  if (pathname === "/upload") return <UploadPage />;
  if (pathname === "/processing") return <Processing />;
  if (pathname === "/library") return <Library />;
  if (pathname?.endsWith("/edit")) return <Result edit />;
  return <Result />;
}
