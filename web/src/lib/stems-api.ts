/** Client for the stem separation API (server/src/routes/stems.routes.ts). */

export const STEM_KEYS = ["vocals", "drums", "bass", "guitar", "piano", "other"] as const;
export type StemKey = (typeof STEM_KEYS)[number];

export type StemJob = {
  id: string;
  status: "running" | "done" | "error";
  fileName: string;
  clipSeconds: number | null;
  device: string;
  elapsedSeconds: number;
  runtimeSeconds: number | null;
  stems: Record<StemKey, string> | null;
  error: { type: string; message: string } | null;
};

export class StemApiError extends Error {
  type: string;
  constructor(type: string, message: string) {
    super(message);
    this.type = type;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    throw new StemApiError(
      err?.type ?? `HTTP ${res.status}`,
      err?.message ?? (res.status === 404 || res.status >= 500
        ? "Can't reach the stem server. Is it running (cd server && npm run dev)?"
        : res.statusText),
    );
  }
  return body as T;
}

export async function startSeparation(file: File, opts: { clipSeconds: number | null; device: string }) {
  const q = new URLSearchParams({ device: opts.device });
  if (opts.clipSeconds) q.set("clip", String(opts.clipSeconds));
  const res = await fetch(`/api/stems?${q}`, {
    method: "POST",
    headers: { "X-Filename": encodeURIComponent(file.name), "Content-Type": "application/octet-stream" },
    body: file,
  });
  return parse<StemJob>(res);
}

export async function getSeparation(id: string) {
  return parse<StemJob>(await fetch(`/api/stems/${id}`));
}

/** Deletes the job's files on the server. `keepalive` lets it run during page unload. */
export function deleteSeparation(id: string) {
  return fetch(`/api/stems/${id}`, { method: "DELETE", keepalive: true }).catch(() => undefined);
}

/** Rough wall time on the M3 Pro CPU we benchmarked (see stems/README.md). */
export function estimateSeconds(audioSeconds: number) {
  return 4 + audioSeconds * 0.33;
}
