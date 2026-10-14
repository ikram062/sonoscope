import { spawn, type ChildProcess } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Runs the Python stem separator (stems/separate.py) as a background job.
// Jobs live in memory and their files in the OS temp dir; both are dropped
// on DELETE, after JOB_TTL_MS, or when the server restarts.

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const SCRIPT = path.join(repoRoot, 'stems', 'separate.py')
const PYTHON = process.env.STEMS_PYTHON ?? path.join(repoRoot, 'stems', '.venv', 'bin', 'python')
const WORK_ROOT = path.join(os.tmpdir(), 'sonoscope-stems')
const JOB_TTL_MS = 60 * 60 * 1000

export const STEM_NAMES = ['vocals', 'drums', 'bass', 'guitar', 'piano', 'other'] as const
export type StemName = (typeof STEM_NAMES)[number]

export type JobStatus = 'running' | 'done' | 'error'

type Job = {
  id: string
  status: JobStatus
  fileName: string
  clipSeconds: number | null
  device: string
  startedAt: number
  finishedAt?: number
  dir: string
  proc: ChildProcess | null
  runtimeSeconds?: number
  stems?: Record<StemName, string>
  error?: { type: string; message: string }
  expiry: NodeJS.Timeout
}

const jobs = new Map<string, Job>()

export class StemsBusyError extends Error {}

export function isPythonReady() {
  return existsSync(PYTHON) && existsSync(SCRIPT)
}

export async function resetWorkDir() {
  await rm(WORK_ROOT, { recursive: true, force: true })
}

export async function startJob(opts: {
  data: Buffer
  fileName: string
  clipSeconds: number | null
  device: string
}): Promise<Job> {
  // Demucs uses every core; running two at once just makes both slow.
  if ([...jobs.values()].some((j) => j.status === 'running')) {
    throw new StemsBusyError('A separation is already running. Wait for it to finish.')
  }

  const id = randomUUID()
  const dir = path.join(WORK_ROOT, id)
  await mkdir(dir, { recursive: true })
  const ext = path.extname(opts.fileName).toLowerCase().replace(/[^.a-z0-9]/g, '')
  const input = path.join(dir, `input${ext}`)
  await writeFile(input, opts.data)

  const args = [SCRIPT, input, '--out', path.join(dir, 'stems'), '--device', opts.device, '--json']
  if (opts.clipSeconds) args.push('--clip', String(opts.clipSeconds))

  const job: Job = {
    id,
    status: 'running',
    fileName: opts.fileName,
    clipSeconds: opts.clipSeconds,
    device: opts.device,
    startedAt: Date.now(),
    dir,
    proc: null,
    expiry: setTimeout(() => void deleteJob(id), JOB_TTL_MS),
  }
  jobs.set(id, job)

  const proc = spawn(PYTHON, args, { stdio: ['ignore', 'pipe', 'pipe'] })
  job.proc = proc
  let stdout = ''
  let stderr = ''
  proc.stdout.on('data', (d) => (stdout += d))
  proc.stderr.on('data', (d) => (stderr += d))
  proc.on('error', (err) => {
    job.status = 'error'
    job.error = { type: 'SpawnError', message: `Could not start ${PYTHON}: ${err.message}` }
  })
  proc.on('close', () => {
    job.proc = null
    job.finishedAt = Date.now()
    // The user's upload isn't needed once the stems exist (or the job failed).
    void rm(input, { force: true })
    if (job.status !== 'running') return
    const last = stdout.trim().split('\n').pop() ?? ''
    try {
      const result = JSON.parse(last)
      if (result.ok) {
        job.status = 'done'
        job.stems = result.stems
        job.runtimeSeconds = result.runtime_s
        job.device = result.device
      } else {
        job.status = 'error'
        job.error = result.error
      }
    } catch {
      job.status = 'error'
      job.error = {
        type: 'CrashError',
        message: stderr.trim().split('\n').slice(-5).join('\n') || 'separate.py exited without a result',
      }
    }
  })

  return job
}

export function getJob(id: string) {
  return jobs.get(id)
}

export function stemPath(id: string, stem: string) {
  const job = jobs.get(id)
  if (job?.status !== 'done' || !job.stems) return null
  return (STEM_NAMES as readonly string[]).includes(stem) ? job.stems[stem as StemName] : null
}

/** Public view of a job; stem paths become URLs under /api/stems. */
export function describeJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    fileName: job.fileName,
    clipSeconds: job.clipSeconds,
    device: job.device,
    elapsedSeconds: ((job.finishedAt ?? Date.now()) - job.startedAt) / 1000,
    runtimeSeconds: job.runtimeSeconds ?? null,
    stems: job.stems
      ? Object.fromEntries(STEM_NAMES.map((s) => [s, `/api/stems/${job.id}/${s}.wav`]))
      : null,
    error: job.error ?? null,
  }
}

export async function deleteJob(id: string) {
  const job = jobs.get(id)
  if (!job) return false
  jobs.delete(id)
  clearTimeout(job.expiry)
  // separate.py kills Demucs and removes its temp files on SIGTERM.
  job.proc?.kill('SIGTERM')
  await rm(job.dir, { recursive: true, force: true })
  return true
}
