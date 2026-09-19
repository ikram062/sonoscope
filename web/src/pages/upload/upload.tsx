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

export default function UploadPage() {
  const router = useNavigate();
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
          onClick={() => router("/processing")}
          className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#c4ff55] text-sm font-semibold text-[#11160f] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Analyze track <ArrowRight size={17} />
        </button>
      </section>
    </Shell>
  );
}
