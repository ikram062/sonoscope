import { useCallback, useEffect, useRef, useState } from "react";

/** One audio source in the mixer. `data` is a URL to fetch or a local File. */
export type PlayerSource = { key: string; data: string | File };

export type PlayerTrack = {
  key: string;
  /** Normalised against the loudest track, so quiet stems look quiet. */
  peaks: number[];
};

type Loaded = { key: string; buffer: AudioBuffer; gain: GainNode };

const PEAK_COUNT = 160;

function rawPeaks(buffer: AudioBuffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const step = Math.max(1, Math.floor(buffer.length / PEAK_COUNT));
  return Array.from({ length: PEAK_COUNT }, (_, i) => {
    let max = 0;
    for (const data of channels)
      for (let j = i * step; j < (i + 1) * step && j < data.length; j++) max = Math.max(max, Math.abs(data[j]));
    return max;
  });
}

/**
 * Plays several equally long tracks in lockstep with the Web Audio API.
 * Every source starts on the same AudioContext clock tick, so stems stay
 * sample-aligned, and each track has its own gain for mute/solo/volume.
 * Sources that fail to load are skipped and listed in `failed`.
 */
export function useStemPlayer(sources: PlayerSource[] | null) {
  const ctx = useRef<AudioContext | null>(null);
  const tracks = useRef<Loaded[]>([]);
  const playing = useRef<AudioBufferSourceNode[]>([]);
  const startedAt = useRef(0); // ctx time at which offset 0 would have played
  const offset = useRef(0); // paused position, in seconds

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [info, setInfo] = useState<PlayerTrack[]>([]);
  const [failed, setFailed] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  // Source identity: reload only when the actual sources change.
  const sig = sources?.map((s) => `${s.key}:${typeof s.data === "string" ? s.data : s.data.name}`).join("|") ?? "";

  useEffect(() => {
    if (!sources) return;
    let cancelled = false;
    const ac = new AudioContext();
    ctx.current = ac;

    Promise.all(
      sources.map(async (s) => {
        try {
          const bytes =
            typeof s.data === "string"
              ? await fetch(s.data).then((r) => {
                  if (!r.ok) throw new Error(`HTTP ${r.status}`);
                  return r.arrayBuffer();
                })
              : await s.data.arrayBuffer();
          const buffer = await ac.decodeAudioData(bytes);
          if (!cancelled) setLoaded((n) => n + 1);
          return { key: s.key, buffer };
        } catch {
          if (!cancelled) setFailed((f) => [...f, s.key]);
          return null;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const ok = results.filter((r): r is { key: string; buffer: AudioBuffer } => r !== null);
      tracks.current = ok.map(({ key, buffer }) => {
        const gain = ac.createGain();
        gain.connect(ac.destination);
        return { key, buffer, gain };
      });
      const raw = ok.map((r) => rawPeaks(r.buffer));
      const top = Math.max(1e-6, ...raw.flat());
      // sqrt keeps quiet material visible without hiding loudness differences.
      setInfo(ok.map((r, i) => ({ key: r.key, peaks: raw[i].map((p) => Math.max(4, Math.sqrt(p / top) * 100)) })));
      // The first source defines the timeline (the stems; an untrimmed original is longer).
      setDuration(ok[0]?.buffer.duration ?? 0);
      offset.current = 0;
      setReady(true);
    });

    return () => {
      cancelled = true;
      playing.current.forEach((n) => n.stop());
      playing.current = [];
      tracks.current = [];
      setIsPlaying(false);
      setLoaded(0);
      setReady(false);
      setFailed([]);
      setInfo([]);
      void ac.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const stopSources = () => {
    playing.current.forEach((n) => {
      n.onended = null;
      n.stop();
    });
    playing.current = [];
  };

  const position = useCallback(() => {
    const ac = ctx.current;
    if (!ac || playing.current.length === 0) return offset.current;
    return Math.min(duration, Math.max(0, ac.currentTime - startedAt.current));
  }, [duration]);

  const startAt = useCallback(
    (from: number) => {
      const ac = ctx.current;
      if (!ac || tracks.current.length === 0) return;
      void ac.resume();
      stopSources();
      const when = ac.currentTime + 0.05;
      startedAt.current = when - from;
      playing.current = tracks.current.map(({ buffer, gain }) => {
        const node = ac.createBufferSource();
        node.buffer = buffer;
        node.connect(gain);
        node.start(when, from, Math.max(0, duration - from));
        return node;
      });
      // All sources end together; listen on one.
      const first = playing.current[0];
      if (first)
        first.onended = () => {
          stopSources();
          offset.current = 0;
          setIsPlaying(false);
        };
      setIsPlaying(true);
    },
    [duration],
  );

  const pause = useCallback(() => {
    offset.current = position();
    stopSources();
    setIsPlaying(false);
  }, [position]);

  const toggle = useCallback(() => {
    if (playing.current.length) pause();
    else startAt(offset.current >= duration ? 0 : offset.current);
  }, [pause, startAt, duration]);

  const seek = useCallback(
    (seconds: number) => {
      const t = Math.max(0, Math.min(duration, seconds));
      if (playing.current.length) startAt(t);
      else offset.current = t;
    },
    [startAt, duration],
  );

  /** Linear gain 0–1 per track key; changes ramp over ~20 ms to avoid clicks. */
  const setGains = useCallback((gains: Record<string, number>) => {
    const ac = ctx.current;
    if (!ac) return;
    for (const t of tracks.current) t.gain.gain.setTargetAtTime(gains[t.key] ?? 0, ac.currentTime, 0.02);
  }, []);

  return {
    total: sources?.length ?? 0,
    loaded,
    ready,
    failed,
    duration,
    tracks: info,
    isPlaying,
    position,
    toggle,
    pause,
    seek,
    setGains,
  };
}
