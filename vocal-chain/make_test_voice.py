#!/usr/bin/env python3
"""Gera uma "voz" sintética com ruído e sibilância para testar a cadeia.

    python make_test_voice.py exemplo.wav
"""

import sys

import numpy as np
import soundfile as sf
from scipy import signal


def synth_voice(sr: int = 48000, seconds: float = 4.0, seed: int = 0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    t = np.arange(int(sr * seconds)) / sr
    f0 = 140 + 25 * np.sin(2 * np.pi * 0.7 * t)                 # entonação
    phase = 2 * np.pi * np.cumsum(f0) / sr
    # Fonte glotal (-12 dB/oitava) moldada por três formantes de vogal.
    source = sum(np.sin(k * phase) / k**2 for k in range(1, 60))
    voiced = np.zeros_like(source)
    for fc, bw, g in ((700, 110, 1.0), (1220, 120, 0.6), (2600, 160, 0.3)):
        b, a = signal.iirpeak(fc, fc / bw, fs=sr)
        voiced += g * signal.lfilter(b, a, source)
    voiced /= np.abs(voiced).max()
    # "Sílabas": envelope liga/desliga com pausas entre palavras.
    syll = (np.sin(2 * np.pi * 2.2 * t) > -0.2).astype(float)
    syll = np.convolve(syll, np.hanning(int(0.03 * sr)), mode="same")
    syll /= syll.max()
    voice = 0.3 * voiced * syll
    # Sibilantes: rajadas de ruído agudo ("s") em alguns pontos.
    hiss = np.diff(rng.standard_normal(len(t) + 1))
    s_env = np.zeros_like(t)
    for start in (s for s in (0.55, 1.6, 2.7, 3.4) if s + 0.12 < seconds):
        i, j = int(start * sr), int((start + 0.12) * sr)
        s_env[i:j] = np.hanning(j - i)
    voice += 0.06 * hiss * s_env
    # Ruído de fundo constante + zumbido de rede de 60 Hz.
    voice += 0.01 * rng.standard_normal(len(t)) + 0.004 * np.sin(2 * np.pi * 60 * t)
    return voice.astype(np.float32)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "exemplo.wav"
    sf.write(out, synth_voice(), 48000, subtype="PCM_16")
    print(f"✓ {out}")
