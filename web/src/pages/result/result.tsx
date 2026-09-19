import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronDown,
  FileAudio,
  Pause,
  Play,
  Save,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Waves,
} from "lucide-react";
import {
  Shell,
  Waveform,
  IconFor,
  genres,
  stems,
  fakeLibrary,
  fallbackWave,
} from "../../components/sonoscope-shared";

export default function ResultPage({ edit = false }: { edit?: boolean }) {
  const router = useNavigate();
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
    <>
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
                This section repeats 6 times and has a clean isolated drum
                pattern with a satisfying pocket — a strong {genre} pick.
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
                router(
                  edit
                    ? "/result/sonoscope-demo"
                    : "/result/sonoscope-demo/edit",
                )
              }
              className="flex h-12 items-center gap-2 rounded-xl border border-white/10 px-5 text-sm text-white/65 hover:bg-white/[.05]"
            >
              {edit ? "Cancel" : "Adjust loop"}
            </button>
            <button
              onClick={() => router("/library")}
              className="flex h-12 items-center gap-2 rounded-xl bg-[#c4ff55] px-5 text-sm font-semibold text-[#11160f]"
            >
              <Save size={16} />
              {edit ? "Save loop" : "Save to library"}
            </button>
          </div>
        </section>
      </Shell>
      ;
    </>
  );
}
