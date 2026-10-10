import sys
from pathlib import Path

import numpy as np
import pytest
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from make_test_voice import synth_voice  # noqa: E402
from process_vocal import main  # noqa: E402
from vocal_chain import PRESETS, ChainConfig, process_audio, process_file  # noqa: E402
from vocal_chain.chain import deess, loudness, noise_floor_db  # noqa: E402

SR = 48000


@pytest.fixture(scope="module")
def voice():
    return synth_voice(SR, seconds=3.0)[np.newaxis, :]


def test_wav_in_wav_out(tmp_path, voice):
    src, dst = tmp_path / "in.wav", tmp_path / "out.wav"
    sf.write(src, voice.T, SR, subtype="PCM_16")
    report = process_file(src, dst)
    out, sr = sf.read(dst, always_2d=True)
    info = sf.info(dst)
    assert sr == SR and info.subtype == "PCM_24" and out.shape[1] == 1
    # A cauda do reverb é acrescentada ao final.
    assert out.shape[0] == voice.shape[1] + int(SR * ChainConfig().tail_seconds)
    assert len(report.stages) == 9


@pytest.mark.parametrize("preset", sorted(PRESETS))
def test_presets_hit_loudness_and_ceiling(preset, voice):
    cfg = ChainConfig().updated(**PRESETS[preset])
    out, report = process_audio(voice, SR, cfg)
    assert np.isfinite(out).all()
    assert abs(report.output_lufs - cfg.target_lufs) < 1.0
    assert np.abs(out).max() <= 10 ** (cfg.ceiling_db / 20) + 1e-6


def test_stereo_keeps_channels(voice):
    stereo = np.vstack([voice[0], 0.8 * voice[0]])
    out, report = process_audio(stereo, SR)
    assert out.shape[0] == 2 and report.channels == 2


def test_noise_is_reduced_in_pauses(voice):
    # Compara o piso de ruído relativo à loudness antes e depois.
    out, _ = process_audio(voice, SR, ChainConfig(reverb=False, delay=False, tail_seconds=0))
    before = noise_floor_db(voice, SR) - loudness(voice, SR)
    after = noise_floor_db(out, SR) - loudness(out, SR)
    assert after < before - 10


def test_deesser_only_touches_sibilance():
    t = np.arange(SR) / SR
    vowel = 0.3 * np.sin(2 * np.pi * 220 * t)
    rng = np.random.default_rng(1)
    hiss = np.zeros_like(t)
    hiss[SR // 2: SR // 2 + 4800] = 0.3 * np.diff(rng.standard_normal(4801))
    x = (vowel + hiss)[np.newaxis, :].astype(np.float32)
    out, max_red, _ = deess(x, SR, ChainConfig())
    assert max_red > 3
    # Vogal sozinha passa praticamente intacta.
    assert np.allclose(out[0, : SR // 4], x[0, : SR // 4], atol=1e-3)


def test_unknown_parameter_is_rejected():
    with pytest.raises(ValueError):
        ChainConfig().updated(nao_existe=1)


def test_cli(tmp_path, voice):
    src, dst = tmp_path / "in.wav", tmp_path / "out.wav"
    sf.write(src, voice.T, SR)
    assert main([str(src), str(dst), "--preset", "podcast", "--sem", "reverb",
                 "--set", "comp_ratio=5", "--bits", "16"]) == 0
    assert sf.info(dst).subtype == "PCM_16"
