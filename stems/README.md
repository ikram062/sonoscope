# Stem separation (Sonoscope)

This is the first step of the Sonoscope pipeline. It splits a song into six stems (vocals, drums, bass, guitar, piano, other) using the pretrained Demucs model **`htdemucs_6s`**. Demucs is called through its own command line (`python -m demucs`) in a subprocess. Nothing is trained or fine-tuned.

## Install

Requirements: Python 3.10+ (tested on 3.12) and ffmpeg.

```bash
# 1. ffmpeg (provides ffmpeg + ffprobe)
ffmpeg -version            # check whether it's installed
brew install ffmpeg        # macOS
sudo apt install ffmpeg    # Ubuntu / Debian / Colab

# 2. Python environment
cd stems
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

The first run downloads the model weights (53 MB) to `~/.cache/torch/hub/checkpoints/`. Later runs work offline.

**Version pins.** Demucs is unmaintained, so the versions matter. The reasons are written at the top of [requirements.txt](requirements.txt). In short:
- `torch==2.5.1` and `torchaudio==2.5.1`: torchaudio 2.9+ changed how wav files are saved, and Demucs 4.0.1 relies on the old `torchaudio.save`.
- `soundfile`: a reliable wav backend for torchaudio.
- `certifi`: fixes the `CERTIFICATE_VERIFY_FAILED` error on the first model download with python.org builds of Python on macOS.

On a CUDA machine, install the CUDA build of torch 2.5.1 first (the command is in requirements.txt).

## Usage

### Command line

```bash
python separate.py song.mp3 --out ./stems/job-123 [--clip 30] [--device cpu] [--timeout 300]
```

```
vocals  /abs/path/stems/job-123/vocals.wav
drums   /abs/path/stems/job-123/drums.wav
bass    /abs/path/stems/job-123/bass.wav
guitar  /abs/path/stems/job-123/guitar.wav
piano   /abs/path/stems/job-123/piano.wav
other   /abs/path/stems/job-123/other.wav
runtime 56.1s on cpu
```

Add `--json` to get one JSON object on stdout instead: `{"ok": true, "stems": {...}, "runtime_s": 14.3, "device": "cpu"}` or `{"ok": false, "error": {"type": "AudioTooShortError", "message": "..."}}`. The Express server uses this. SIGTERM (or Ctrl-C) kills the Demucs child and removes partial output.

The exit code is 0 on success. On failure it is 1 and the error is printed as `error (<ExceptionName>): message` on stderr.

### Python

```python
from separate import separate_stems, StemSeparationError

try:
    stems = separate_stems("song.mp3", "/tmp/sonoscope/job-123",
                           device="auto", clip_seconds=None, timeout=300)
except StemSeparationError as e:
    ...  # see "Errors" below
```

### In the web app

The **Stem Separator** page (`/stems`) uploads a song to the Express server. The server runs `separate.py --json` as a background job, and the page plays the six stems in a mixer (volume, mute, solo, A/B against the original, download).

```bash
cd server && npm run dev        # API on :3000 (PORT=3001 npm run dev if 3000 is taken)
cd web && npm run dev           # API_TARGET=http://localhost:3001 npm run dev to match
```

API (server/src/routes/stems.routes.ts): `POST /api/stems?clip=30&device=auto` (raw file body, `X-Filename` header) → `GET /api/stems/:id` (poll) → `GET /api/stems/:id/<stem>.wav` → `DELETE /api/stems/:id`. Only one job runs at a time (409 otherwise). Files live in the OS temp dir and are deleted on DELETE, after 1 hour, or on server restart. The server finds Python at `stems/.venv/bin/python`; override it with `STEMS_PYTHON`.

## Return format (contract for the next pipeline steps)

`separate_stems` returns a `dict[str, str]` with **exactly these six keys, in this order**:

```python
{
    "vocals": "/abs/out_dir/vocals.wav",
    "drums":  "/abs/out_dir/drums.wav",
    "bass":   "/abs/out_dir/bass.wav",
    "guitar": "/abs/out_dir/guitar.wav",
    "piano":  "/abs/out_dir/piano.wav",
    "other":  "/abs/out_dir/other.wav",
}
```

- Paths are absolute strings, always `<out_dir>/<stem>.wav`. Demucs' own `htdemucs_6s/<track>/` folder and the temp files are removed, so `out_dir` contains only these six files (plus anything that was there before).
- WAV, **16-bit PCM, stereo** (mono input comes back as two identical channels), at the **same sample rate as the input**, and **the same length as the input** (or the clip), within 50 ms.
- Existing `<stem>.wav` files in `out_dir` are overwritten. **Use one `out_dir` per job.**
- Results are all or nothing: either all six files exist, or an exception is raised and none of the six were written.
- The stem names are also exported as `separate.STEM_NAMES`.

## Errors

All errors inherit from `StemSeparationError`:

| Exception | When | Also a subclass of |
|---|---|---|
| `InputNotFoundError` | path doesn't exist / isn't a file | `FileNotFoundError` |
| `UnsupportedAudioError` | extension not in `.mp3 .wav .flac .m4a .aac .ogg .aif .aiff`, no audio stream, or ffmpeg can't decode it | `ValueError` |
| `AudioTooShortError` | audio to process < 10 s | `ValueError` |
| `AudioTooLongError` | audio to process > 10 min | `ValueError` |
| `DemucsError` | Demucs (or ffmpeg resampling) exited non-zero or didn't write all stems. The message includes the end of its stderr | `RuntimeError` |
| `SeparationTimeoutError` | the whole job took longer than `timeout` (default 300 s). The Demucs process group is killed | `TimeoutError` |
| `FFmpegNotFoundError` | ffmpeg/ffprobe not on PATH | `RuntimeError` |

Passing an invalid `device` or `clip_seconds <= 0` raises a plain `ValueError` (programmer error).

The length limits apply to the audio that will actually be processed. A 15-minute file with `clip_seconds=30` is therefore accepted, and `clip_seconds=5` is rejected as too short.

## Devices

- `auto` (default): `cuda` if `torch.cuda.is_available()`, otherwise `cpu`.
- `cpu`, `cuda`, `cuda:N`: passed straight to Demucs.
- `mps` (Apple GPU): **does not work** with torch 2.5.1 (`NotImplementedError: Output channels > 65536 not supported at the MPS device`), even with `PYTORCH_ENABLE_MPS_FALLBACK=1`. Use `cpu` on Macs. CPU is fast enough there anyway (see below).

## Runtime

Measured on this machine: Apple M3 Pro (11 cores), 18 GB RAM, CPU, `htdemucs_6s`, end-to-end wall time including decode and model load (~3 s of fixed overhead).

| Input | Length | Device | Runtime | Speed |
|---|---|---|---|---|
| 30 s clip (`--clip 30`), song A | 0:30 | cpu | 14.3 s | 2.1× real time |
| 30 s clip (`--clip 30`), song B | 0:30 | cpu | 14.0 s | 2.1× real time |
| Full song A | 2:57 | cpu | 56.1 s | 3.1× real time |
| Full song B | 2:44 | cpu | 67.3 s | 2.4× real time |

**Verdict:** on a recent laptop CPU (Apple Silicon), full songs are fine, at roughly 1 minute for a 3-minute song. A 10-minute song (the maximum) would take about 3–4 minutes, which is close to the default 5-minute timeout. Raise `timeout` if long songs are expected.

Older or smaller CPUs (for example a 2-vCPU cloud VM or a free-tier server) can easily be 5–10× slower, which puts a full song past the timeout. Options there:

| Option | Speed | Trade-offs |
|---|---|---|
| **Clip mode** (`clip_seconds=30–60`) | fastest, any machine | Loop detection only sees part of the song, so the best loop might be elsewhere. Fine for demos. |
| **Google Colab (T4 GPU)** | typically well under real time | Free and easy for experiments, but sessions disconnect, there's no stable endpoint, and it isn't a production backend. |
| **Cloud GPU** (e.g. a small serverless GPU worker) | seconds per song | Costs money, needs a deployment and has cold starts. It's the right choice if many users process full songs. |

(GPU numbers were not measured; there's no CUDA device here.)

## Quality caveats: don't over-trust the stems

- **The piano stem is the weakest** in `htdemucs_6s`. It often contains leakage from guitar, synths and keys, or it's nearly silent when piano is present. On one test song its RMS was ~0.0003 while the other stems were 0.04–0.17. Loop detection should treat piano as low confidence. For example, don't pick a loop *because* of the piano stem alone.
- **The stems don't add up exactly to the mix.** On real songs the sum of the six stems differs from the original by about **6–8%** (relative L2 error). We measured that this comes from the model itself (it isn't trained to make the stems sum to the mix), not from our wav writing. We use `--clip-mode clamp`, which costs <0.1%; Demucs' default "rescale" mode would add about 3 points by turning down loud stems. Use the original mix for anything that needs the exact audio.
- Demucs applies a random time shift on each run, so two runs on the same file give slightly different stems.

## Disk usage and cleanup

Six 16-bit stereo 44.1 kHz WAVs take **~1 MB per second of audio**: about **180 MB for a 3-minute song** and up to ~1 GB for a 10-minute one. A 30-second clip is ~32 MB. During a run, the temp folder needs roughly the same space again, plus the decoded input.

Since the app deletes user audio after the session:
- Give every job its own `out_dir` (e.g. `/tmp/sonoscope/<job_id>/`), and `shutil.rmtree(out_dir)` as soon as the stems are uploaded and analysed, including on errors.
- Temp files (`out_dir/.stems-tmp-*`) are always removed by `separate_stems`, even on failure or timeout. The one exception is a hard kill (`SIGKILL`/power loss), so a periodic sweep of old job folders is a good safety net.
- The model cache (`~/.cache/torch/hub`, 53 MB) is not user data; keep it.

## Tests

```bash
cd stems
.venv/bin/python -m pytest -s tests                 # synthetic 15 s clip, ~25 s total
SONOSCOPE_TEST_AUDIO=~/Music/song.mp3 .venv/bin/python -m pytest -s tests   # first 15 s of a real song
```

The tests check:
- exactly 6 stems are returned and every file exists, and no temp folders are left behind
- every stem has the same sample rate and duration as the input (including a 48 kHz input)
- clip mode trims correctly
- the stem-sum error: always printed, a warning if it's above 5%, and a failure above 20% (only with real audio, see below)
- every bad input raises its named exception and leaves `out_dir` empty: missing file, bad extension, corrupt mp3, too short, too long, Demucs failure, timeout, bad device

The synthetic clip (tones + noise) isn't real music. The model drops part of it, and its sum error varies between 6% and 25% from run to run. So with the synthetic clip the sum check only reports; it hard-fails only on real audio.
