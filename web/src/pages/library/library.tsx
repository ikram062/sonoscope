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

export default function LibraryPage() {
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
