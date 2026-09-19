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

export default function HomePage() {
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
