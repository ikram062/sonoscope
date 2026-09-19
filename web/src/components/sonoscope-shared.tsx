import {
  Disc3,
  GripVertical,
  Library as LibraryIcon,
  Mic2,
  Piano,
  Drum,
  Guitar,
  Music2,
} from "lucide-react";

export const genres = ["Hip-Hop", "R&B", "Lo-Fi", "Pop", "Electronic", "Other"];
export const stems = ["Vocals", "Drums", "Bass", "Guitar", "Piano", "Other"];
export const fakeLibrary = [
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
export const fallbackWave = Array.from(
  { length: 96 },
  (_, i) => 24 + ((i * 37) % 64),
);

export function Logo() {
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
export function Nav() {
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
export function Waveform({
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
export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0c100d] text-white selection:bg-[#c4ff55] selection:text-black">
      <Nav />
      {children}
    </main>
  );
}
export function IconFor({ stem }: { stem: string }) {
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
