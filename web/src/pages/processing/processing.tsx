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

export default function ProcessingPage() {
  const router = useNavigate();
  const [p, setP] = useState(8);
  useEffect(() => {
    fetch("/api/analyze", { method: "POST" }).catch(() => {});
    const id = setInterval(
      () =>
        setP((v) => {
          if (v >= 92) {
            clearInterval(id);
            router("/result/sonoscope-demo");
            return 100;
          }
          return Math.min(99, v + 7);
        }),
      260,
    );
    return () => clearInterval(id);
  }, [router]);
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
