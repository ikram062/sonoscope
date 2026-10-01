export const genres = ["Hip-Hop", "R&B", "Lo-Fi", "Pop", "Electronic", "Other"];
export const stems = ["Vocals", "Drums", "Bass", "Guitar", "Piano", "Other"];

/** The four spectrum stops. Everything colourful in the UI is one of these. */
export const palette = {
  mint: "#8ef0c9",
  iris: "#9fb4ff",
  orchid: "#e6a8ff",
  peach: "#ffc29a",
  paper: "#f4f1ea",
} as const;

/** Special colour value: paint with the full spectrum gradient instead of one hue. */
export const SPECTRUM = "spectrum";
export const spectrumGradient = `linear-gradient(90deg, ${palette.mint}, ${palette.iris} 35%, ${palette.orchid} 68%, ${palette.peach})`;

export const genreColor: Record<string, string> = {
  "Hip-Hop": palette.peach,
  "R&B": palette.orchid,
  "Lo-Fi": palette.iris,
  Pop: "#ff9fc8",
  Electronic: palette.mint,
  Other: palette.paper,
};

export const stemColor: Record<string, string> = {
  Vocals: palette.orchid,
  Drums: palette.peach,
  Bass: palette.iris,
  Guitar: "#ffe08a",
  Piano: palette.mint,
  Other: "#c9c4ba",
};

export type LibraryItem = {
  id: string;
  title: string;
  genre: string;
  start: number;
  end: number;
  duration: number;
  bpm: number;
  musicalKey: string;
  added: string;
  /** Days since it was saved, for sorting. */
  age: number;
  color: string;
};

export const fakeLibrary: LibraryItem[] = [
  {
    id: "midnight-drive",
    title: "midnight-drive.wav",
    genre: "Hip-Hop",
    start: 42,
    end: 84,
    duration: 272,
    bpm: 92,
    musicalKey: "F minor",
    added: "Today",
    age: 0,
    color: palette.peach,
  },
  {
    id: "velvet-room",
    title: "velvet-room.mp3",
    genre: "R&B",
    start: 78,
    end: 130,
    duration: 241,
    bpm: 74,
    musicalKey: "A♭ major",
    added: "Yesterday",
    age: 1,
    color: palette.orchid,
  },
  {
    id: "rainy-window",
    title: "rainy-window.aiff",
    genre: "Lo-Fi",
    start: 24,
    end: 72,
    duration: 188,
    bpm: 80,
    musicalKey: "D minor",
    added: "3 days ago",
    age: 3,
    color: palette.iris,
  },
  {
    id: "neon-signal",
    title: "neon-signal.wav",
    genre: "Electronic",
    start: 122,
    end: 153,
    duration: 314,
    bpm: 124,
    musicalKey: "G minor",
    added: "Last week",
    age: 7,
    color: palette.mint,
  },
];

/** Deterministic, musical-looking waveform for demo tracks. */
export function demoWave(seed = 1, length = 96) {
  return Array.from({ length }, (_, i) => {
    const t = i / length;
    const env = 0.55 + 0.45 * Math.sin(Math.PI * t);
    const beat = (i + seed) % 4 === 0 ? 1 : 0.62;
    const noise = ((i * 37 + seed * 53) % 29) / 29;
    return Math.round(Math.max(10, Math.min(100, env * beat * (55 + noise * 45))));
  });
}
export const fallbackWave = demoWave(1);

export function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `#rrggbb` + alpha (0–1) → `#rrggbbaa`. */
export function alpha(hex: string, a: number) {
  return hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0");
}
