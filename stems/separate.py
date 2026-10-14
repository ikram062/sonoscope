"""Stem separation for Sonoscope.

Splits an audio file into six stems (vocals, drums, bass, guitar, piano, other)
with the pretrained Demucs model ``htdemucs_6s``. Demucs is invoked through its
command line (``python -m demucs``) in a subprocess.

Library use:
    from separate import separate_stems
    stems = separate_stems("song.mp3", "./stems/job-123")
    stems["drums"]  # -> "/abs/path/stems/job-123/drums.wav"

Command line:
    python separate.py song.mp3 --out ./stems [--clip 30] [--device cpu]
"""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path

MODEL_NAME = "htdemucs_6s"
STEM_NAMES = ("vocals", "drums", "bass", "guitar", "piano", "other")
MODEL_SAMPLE_RATE = 44100  # htdemucs_6s always writes 44.1 kHz

MIN_DURATION_S = 10.0
MAX_DURATION_S = 600.0
DEFAULT_TIMEOUT_S = 300.0
SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg", ".aif", ".aiff"}
VALID_DEVICES = ("auto", "cpu", "cuda", "mps")


# --- Exceptions ---------------------------------------------------------------

class StemSeparationError(Exception):
    """Base class for every error raised by this module."""


class InputNotFoundError(StemSeparationError, FileNotFoundError):
    """The input path does not exist or is not a file."""


class UnsupportedAudioError(StemSeparationError, ValueError):
    """The file type is not supported, or ffmpeg cannot read audio from it."""


class AudioTooShortError(StemSeparationError, ValueError):
    """The audio to process is shorter than MIN_DURATION_S."""


class AudioTooLongError(StemSeparationError, ValueError):
    """The audio to process is longer than MAX_DURATION_S."""


class DemucsError(StemSeparationError, RuntimeError):
    """Demucs (or the ffmpeg pre/post-processing around it) failed."""


class SeparationTimeoutError(StemSeparationError, TimeoutError):
    """The job did not finish within the timeout."""


class FFmpegNotFoundError(StemSeparationError, RuntimeError):
    """ffmpeg/ffprobe are not on PATH."""


# --- Helpers ------------------------------------------------------------------

def _require_ffmpeg() -> None:
    missing = [tool for tool in ("ffmpeg", "ffprobe") if shutil.which(tool) is None]
    if missing:
        raise FFmpegNotFoundError(
            f"{', '.join(missing)} not found on PATH. Install ffmpeg "
            "(macOS: `brew install ffmpeg`, Ubuntu: `sudo apt install ffmpeg`)."
        )


def _resolve_device(device: str) -> str:
    base = device.split(":", 1)[0]
    if base not in VALID_DEVICES:
        raise ValueError(f"device must be one of {VALID_DEVICES} (or cuda:N), got {device!r}")
    if device != "auto":
        return device
    import torch  # imported lazily: it is slow and only needed for "auto"

    return "cuda" if torch.cuda.is_available() else "cpu"


def _probe(path: Path, timeout: float) -> tuple[float, int]:
    """Return (duration_seconds, sample_rate) of the first audio stream."""
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=sample_rate,duration:format=duration",
        "-of", "json", str(path),
    ]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired as e:
        raise SeparationTimeoutError(f"ffprobe timed out on {path}") from e
    if proc.returncode != 0:
        raise UnsupportedAudioError(f"Cannot read {path.name}: {proc.stderr.strip() or 'ffprobe failed'}")
    info = json.loads(proc.stdout or "{}")
    streams = info.get("streams") or []
    if not streams:
        raise UnsupportedAudioError(f"{path.name} contains no audio stream")
    stream = streams[0]
    try:
        sample_rate = int(stream["sample_rate"])
        duration = float(stream.get("duration") or info["format"]["duration"])
    except (KeyError, TypeError, ValueError) as e:
        raise UnsupportedAudioError(f"Cannot determine duration/sample rate of {path.name}") from e
    return duration, sample_rate


def _run(cmd: list[str], deadline: float, what: str, env: dict | None = None) -> None:
    """Run cmd, killing its whole process group if the deadline passes."""
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise SeparationTimeoutError(f"Timed out before {what} could start")
    proc = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
        env=env, start_new_session=True,
    )
    try:
        _, stderr = proc.communicate(timeout=remaining)
    except subprocess.TimeoutExpired:
        os.killpg(proc.pid, signal.SIGKILL)
        proc.communicate()
        raise SeparationTimeoutError(f"{what} did not finish within the timeout") from None
    except BaseException:
        # Interrupted (Ctrl-C, SIGTERM): don't leave Demucs running on its own.
        os.killpg(proc.pid, signal.SIGKILL)
        proc.communicate()
        raise
    if proc.returncode != 0:
        tail = "\n".join(stderr.strip().splitlines()[-15:])
        raise DemucsError(f"{what} failed (exit code {proc.returncode}):\n{tail}")


def _demucs_env() -> dict:
    env = os.environ.copy()
    # python.org builds on macOS ship without a CA bundle, which breaks the
    # first-run model download. Point it at certifi's bundle if nothing is set.
    if "SSL_CERT_FILE" not in env:
        try:
            import certifi

            env["SSL_CERT_FILE"] = certifi.where()
        except ImportError:
            pass
    return env


# --- Public API ---------------------------------------------------------------

def separate_stems(
    input_path: str | os.PathLike,
    out_dir: str | os.PathLike,
    device: str = "auto",
    clip_seconds: float | None = None,
    timeout: float = DEFAULT_TIMEOUT_S,
) -> dict[str, str]:
    """Split ``input_path`` into six stems and write them to ``out_dir``.

    Returns ``{stem_name: absolute_wav_path}`` for vocals, drums, bass, guitar,
    piano, other (in that order). Files are named ``<out_dir>/<stem>.wav``,
    16-bit PCM, stereo, at the input's sample rate, and as long as the input
    (or the clip). Existing files with those names are overwritten.

    Either all six files are written or none are: on any error the partial
    output is removed and a ``StemSeparationError`` subclass is raised.
    """
    deadline = time.monotonic() + timeout
    _require_ffmpeg()

    src = Path(input_path).expanduser()
    if not src.is_file():
        raise InputNotFoundError(f"Input file not found: {src}")
    if src.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise UnsupportedAudioError(
            f"Unsupported file type {src.suffix or '(none)'!r}; "
            f"expected one of {sorted(SUPPORTED_EXTENSIONS)}"
        )
    if clip_seconds is not None and clip_seconds <= 0:
        raise ValueError("clip_seconds must be positive")
    resolved_device = _resolve_device(device)

    duration, sample_rate = _probe(src, timeout=max(1.0, deadline - time.monotonic()))
    effective = min(duration, clip_seconds) if clip_seconds else duration
    if effective < MIN_DURATION_S:
        raise AudioTooShortError(f"Audio is {effective:.1f}s; minimum is {MIN_DURATION_S:.0f}s")
    if effective > MAX_DURATION_S:
        raise AudioTooLongError(
            f"Audio is {effective:.1f}s; maximum is {MAX_DURATION_S:.0f}s (use clip_seconds to trim)"
        )

    out = Path(out_dir).expanduser().resolve()
    out.mkdir(parents=True, exist_ok=True)
    # Work inside out_dir so the final step is a same-filesystem rename.
    work = Path(tempfile.mkdtemp(prefix=".stems-tmp-", dir=out))
    final_paths = {name: out / f"{name}.wav" for name in STEM_NAMES}
    committed: list[Path] = []
    try:
        # 1. Decode (and optionally trim) to a float wav. This also catches
        #    files that ffprobe accepts but ffmpeg cannot fully decode.
        decoded = work / "input.wav"
        trim = ["-t", f"{clip_seconds}"] if clip_seconds else []
        try:
            _run(
                ["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(src), *trim,
                 "-vn", "-c:a", "pcm_f32le", str(decoded)],
                deadline, "ffmpeg decode",
            )
        except DemucsError as e:
            raise UnsupportedAudioError(f"ffmpeg could not decode {src.name}: {e}") from e

        # 2. Separate.
        demucs_out = work / "demucs"
        _run(
            [sys.executable, "-m", "demucs", "-n", MODEL_NAME, "-d", resolved_device,
             "--clip-mode", "clamp", "-o", str(demucs_out),
             "--filename", "{stem}.{ext}", str(decoded)],
            deadline, "Demucs", env=_demucs_env(),
        )
        produced = {name: demucs_out / MODEL_NAME / f"{name}.wav" for name in STEM_NAMES}
        missing = [name for name, p in produced.items() if not p.is_file()]
        if missing:
            raise DemucsError(f"Demucs finished but did not write: {', '.join(missing)}")

        # 3. Demucs always writes 44.1 kHz; bring stems back to the input rate.
        if sample_rate != MODEL_SAMPLE_RATE:
            for name, p in produced.items():
                resampled = work / f"{name}.resampled.wav"
                _run(
                    ["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(p),
                     "-af", f"aresample={sample_rate}",
                     "-c:a", "pcm_s16le", str(resampled)],
                    deadline, f"ffmpeg resample ({name})",
                )
                produced[name] = resampled

        # 4. Commit: move all six into place, then report clean paths.
        for name in STEM_NAMES:
            os.replace(produced[name], final_paths[name])
            committed.append(final_paths[name])
    except BaseException:
        for p in committed:
            p.unlink(missing_ok=True)
        raise
    finally:
        shutil.rmtree(work, ignore_errors=True)

    return {name: str(final_paths[name]) for name in STEM_NAMES}


# --- Command line -------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=f"Split a song into 6 stems with Demucs {MODEL_NAME}.")
    parser.add_argument("input", help="audio file (mp3, wav, flac, m4a, ...)")
    parser.add_argument("--out", required=True, help="directory to write <stem>.wav files into")
    parser.add_argument("--clip", type=float, default=None, metavar="SECONDS",
                        help="only process the first N seconds")
    parser.add_argument("--device", default="auto", help="auto (default), cpu, cuda, cuda:N or mps")
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT_S, metavar="SECONDS",
                        help=f"abort after this many seconds (default {DEFAULT_TIMEOUT_S:.0f})")
    parser.add_argument("--json", action="store_true",
                        help="print one JSON object (result or error) on stdout, for other programs")
    args = parser.parse_args(argv)
    # Turn SIGTERM into an exception so cleanup runs and the Demucs child is killed.
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))

    try:
        device = _resolve_device(args.device)
    except ValueError as e:
        parser.error(str(e))

    start = time.perf_counter()
    try:
        stems = separate_stems(args.input, args.out, device=device,
                               clip_seconds=args.clip, timeout=args.timeout)
    except (StemSeparationError, ValueError) as e:
        if args.json:
            print(json.dumps({"ok": False, "error": {"type": type(e).__name__, "message": str(e)}}))
        else:
            print(f"error ({type(e).__name__}): {e}", file=sys.stderr)
        return 1
    elapsed = time.perf_counter() - start

    if args.json:
        print(json.dumps({"ok": True, "stems": stems, "runtime_s": round(elapsed, 2), "device": device}))
        return 0
    for name, path in stems.items():
        print(f"{name:7s} {path}")
    print(f"runtime {elapsed:.1f}s on {device}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
