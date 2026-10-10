"""Etapas da cadeia de edição vocal.

O áudio circula como ``float32`` no formato ``(canais, amostras)``, que é o
formato esperado pelo pedalboard. A ordem segue a de um estúdio:

    ajuste de entrada → redução de ruído → gate → EQ → de-esser → compressão
    → saturação → reverb e delay (envios paralelos) → normalização → limiter
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from pathlib import Path

import noisereduce as nr
import numpy as np
import pedalboard as pb
import pyloudnorm as pyln
import soundfile as sf
from scipy import signal


@dataclass
class ChainConfig:
    # Ajuste de entrada: leva qualquer gravação a um nível conhecido para que
    # os limiares de gate, de-esser e compressor funcionem do mesmo jeito.
    input_lufs: float = -23.0

    # Redução de ruído (noisereduce, espectral)
    denoise: bool = True
    denoise_amount: float = 0.85          # 0..1, quanto do ruído estimado remover
    denoise_stationary: bool = True       # ruído constante (ar-condicionado, chiado)

    # Gate / expansor. O limiar é calculado a partir do piso de ruído medido.
    gate: bool = True
    gate_above_floor_db: float = 6.0
    gate_ratio: float = 4.0
    gate_attack_ms: float = 2.0
    gate_release_ms: float = 150.0

    # Equalização
    eq: bool = True
    highpass_hz: float = 80.0
    mud_hz: float = 300.0
    mud_db: float = -3.0
    mud_q: float = 1.0
    presence_hz: float = 3500.0
    presence_db: float = 2.5
    presence_q: float = 0.9
    air_hz: float = 10000.0
    air_db: float = 3.0

    # De-esser (dinâmico, só na banda de sibilância)
    deess: bool = True
    deess_hz: float = 5500.0
    deess_threshold_db: float = -8.0      # nível da banda aguda relativo ao sinal todo
    deess_ratio: float = 4.0
    deess_max_reduction_db: float = 10.0
    deess_floor_db: float = -42.0         # abaixo disso a banda aguda é ignorada

    # Compressão
    compress: bool = True
    comp_threshold_db: float = -20.0
    comp_ratio: float = 3.0
    comp_attack_ms: float = 8.0
    comp_release_ms: float = 120.0

    # Saturação leve (tanh com sobreamostragem 4x)
    saturate: bool = True
    sat_drive_db: float = 6.0
    sat_mix: float = 0.35

    # Reverb curto (envio paralelo)
    reverb: bool = True
    reverb_send_db: float = -18.0
    reverb_room: float = 0.22
    reverb_damping: float = 0.6
    reverb_predelay_ms: float = 20.0

    # Delay curto / slapback (envio paralelo)
    delay: bool = True
    delay_send_db: float = -24.0
    delay_ms: float = 110.0
    delay_feedback: float = 0.15

    # Saída
    target_lufs: float = -16.0
    ceiling_db: float = -1.0
    tail_seconds: float = 0.6             # cauda para o reverb não cortar seco

    def updated(self, **overrides) -> "ChainConfig":
        unknown = set(overrides) - set(asdict(self))
        if unknown:
            raise ValueError(f"parâmetros desconhecidos: {', '.join(sorted(unknown))}")
        return ChainConfig(**{**asdict(self), **overrides})


@dataclass
class ChainReport:
    sample_rate: int
    channels: int
    input_lufs: float
    output_lufs: float
    output_peak_db: float
    gate_threshold_db: float | None = None
    deess_max_reduction_db: float = 0.0
    deess_active_percent: float = 0.0
    stages: list[str] = field(default_factory=list)


def db_to_lin(db: float) -> float:
    return float(10.0 ** (db / 20.0))


def lin_to_db(x: float) -> float:
    return float(20.0 * np.log10(max(x, 1e-12)))


def loudness(audio: np.ndarray, sr: int) -> float:
    """LUFS integrado (ITU-R BS.1770). Áudios curtos demais caem para RMS."""
    if audio.shape[1] < int(0.4 * sr):
        return lin_to_db(float(np.sqrt(np.mean(audio**2))))
    value = pyln.Meter(sr).integrated_loudness(audio.T)
    return float(value) if np.isfinite(value) else -120.0


def gain_to_lufs(audio: np.ndarray, sr: int, target: float) -> np.ndarray:
    current = loudness(audio, sr)
    if current <= -100.0:
        return audio
    return audio * db_to_lin(target - current)


def noise_floor_db(audio: np.ndarray, sr: int, frame_ms: float = 50.0, peak: bool = False) -> float:
    """Piso de ruído: percentil 10 do nível (RMS ou pico) em janelas curtas."""
    mono = audio.mean(axis=0)
    hop = max(1, int(sr * frame_ms / 1000))
    n = len(mono) // hop
    if n < 4:
        return -90.0
    frames = mono[: n * hop].reshape(n, hop)
    rms = np.sqrt(np.mean(frames**2, axis=1))
    level = np.abs(frames).max(axis=1) if peak else rms
    level = level[rms > 1e-7]  # ignora silêncio digital (ex.: a cauda acrescentada)
    if level.size == 0:
        return -90.0
    return lin_to_db(float(np.percentile(level, 10)))


def denoise(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    out = nr.reduce_noise(
        y=audio,
        sr=sr,
        stationary=cfg.denoise_stationary,
        prop_decrease=cfg.denoise_amount,
    )
    return np.asarray(out, dtype=np.float32).reshape(audio.shape)


def gate(audio: np.ndarray, sr: int, cfg: ChainConfig) -> tuple[np.ndarray, float]:
    # O detector do gate reage a picos, então o limiar parte do pico do ruído.
    floor = noise_floor_db(audio, sr, peak=True)
    threshold = float(np.clip(floor + cfg.gate_above_floor_db, -75.0, -38.0))
    board = pb.Pedalboard([
        pb.NoiseGate(
            threshold_db=threshold,
            ratio=cfg.gate_ratio,
            attack_ms=cfg.gate_attack_ms,
            release_ms=cfg.gate_release_ms,
        )
    ])
    return board(audio, sr), threshold


def equalize(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    nyquist = sr / 2
    stages: list[pb.Plugin] = [
        pb.HighpassFilter(cutoff_frequency_hz=cfg.highpass_hz),
        pb.PeakFilter(cutoff_frequency_hz=cfg.mud_hz, gain_db=cfg.mud_db, q=cfg.mud_q),
    ]
    if cfg.presence_hz < nyquist * 0.9:
        stages.append(pb.PeakFilter(
            cutoff_frequency_hz=cfg.presence_hz, gain_db=cfg.presence_db, q=cfg.presence_q))
    if cfg.air_hz < nyquist * 0.9:
        stages.append(pb.HighShelfFilter(cutoff_frequency_hz=cfg.air_hz, gain_db=cfg.air_db))
    return pb.Pedalboard(stages)(audio, sr)


def _envelope(x: np.ndarray, sr: int, attack_ms: float, release_ms: float) -> np.ndarray:
    """Seguidor de envelope de pico com ataque e liberação separados."""
    # Ataque: o máximo móvel captura o início de cada "s" sem atraso.
    win = max(1, int(sr * attack_ms / 1000))
    peak = np.abs(x)
    if win > 1:
        from scipy.ndimage import maximum_filter1d
        peak = maximum_filter1d(peak, size=win, axis=-1)
    # Liberação: filtro de um polo suaviza a queda.
    a = np.exp(-1.0 / (sr * release_ms / 1000))
    return signal.lfilter([1 - a], [1, -a], peak, axis=-1)


def deess(audio: np.ndarray, sr: int, cfg: ChainConfig) -> tuple[np.ndarray, float, float]:
    """De-esser relativo: atua quando a banda aguda chega perto do nível do
    sinal inteiro, o que acontece nos "s", "x" e "ch", mas não nas vogais."""
    if cfg.deess_hz >= sr / 2 * 0.9:
        return audio, 0.0, 0.0
    # Divisão complementar de fase zero: low + high reconstrói o sinal exato,
    # então só a banda de sibilância é atenuada.
    sos = signal.butter(4, cfg.deess_hz, btype="highpass", fs=sr, output="sos")
    high = signal.sosfiltfilt(sos, audio, axis=-1)
    low = audio - high

    # Detecção no canal mais alto para não deslocar a imagem estéreo.
    hi_db = 20 * np.log10(np.maximum(_envelope(high, sr, 1.0, 60.0).max(axis=0), 1e-9))
    full_db = 20 * np.log10(np.maximum(_envelope(audio, sr, 1.0, 60.0).max(axis=0), 1e-9))
    over = np.maximum(hi_db - (full_db + cfg.deess_threshold_db), 0.0)
    over[hi_db < cfg.deess_floor_db] = 0.0  # não reage a chiado residual nas pausas
    reduction_db = np.minimum(over * (1 - 1 / cfg.deess_ratio), cfg.deess_max_reduction_db)
    gain = 10 ** (-reduction_db / 20)
    out = low + high * gain[np.newaxis, :]
    active = 100.0 * float(np.mean(reduction_db > 1.0)) if reduction_db.size else 0.0
    return out.astype(np.float32), float(reduction_db.max(initial=0.0)), active


def compress(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    board = pb.Pedalboard([
        pb.Compressor(
            threshold_db=cfg.comp_threshold_db,
            ratio=cfg.comp_ratio,
            attack_ms=cfg.comp_attack_ms,
            release_ms=cfg.comp_release_ms,
        )
    ])
    return board(audio, sr)


def saturate(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    drive = db_to_lin(cfg.sat_drive_db)
    up = signal.resample_poly(audio, 4, 1, axis=-1)
    # tanh(d·x)/d tem ganho 1 em sinais baixos e arredonda só os picos,
    # acrescentando harmônicos ímpares suaves ("calor" de fita/válvula).
    wet = np.tanh(drive * up) / drive
    down = signal.resample_poly(wet, 1, 4, axis=-1)[:, : audio.shape[1]]
    return ((1 - cfg.sat_mix) * audio + cfg.sat_mix * down).astype(np.float32)


def ambience(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    """Reverb e delay em envio paralelo: o sinal seco fica intacto."""
    # O envio é filtrado para que graves e sibilância não encham o ambiente.
    send_filter = [pb.HighpassFilter(cutoff_frequency_hz=200.0)]
    if sr / 2 > 7000:
        send_filter.append(pb.LowpassFilter(cutoff_frequency_hz=7000.0))
    out = audio.copy()

    if cfg.reverb:
        predelay = int(sr * cfg.reverb_predelay_ms / 1000)
        send = np.pad(audio, ((0, 0), (predelay, 0)))[:, : audio.shape[1]]
        wet = pb.Pedalboard([
            *send_filter,
            pb.Reverb(room_size=cfg.reverb_room, damping=cfg.reverb_damping,
                      wet_level=1.0, dry_level=0.0, width=1.0),
        ])(send, sr)
        out += wet * db_to_lin(cfg.reverb_send_db)

    if cfg.delay:
        wet = pb.Pedalboard([
            *send_filter,
            pb.Delay(delay_seconds=cfg.delay_ms / 1000, feedback=cfg.delay_feedback, mix=1.0),
        ])(audio, sr)
        out += wet * db_to_lin(cfg.delay_send_db)

    return out.astype(np.float32)


def finalize(audio: np.ndarray, sr: int, cfg: ChainConfig) -> np.ndarray:
    """Normaliza a loudness e segura os picos com um limiter de true peak.

    O limiter tira um pouco de loudness ao segurar os picos, então o ganho é
    reaplicado algumas vezes até o resultado ficar a menos de 0,3 LU do alvo.
    """
    gain_db = cfg.target_lufs - loudness(audio, sr)
    best, best_miss = audio, float("inf")
    for _ in range(4):
        limiter = pb.Pedalboard([
            pb.BrickwallLimiter(ceiling_db=cfg.ceiling_db, release_ms=80.0,
                                lookahead_ms=5.0, true_peak=True)
        ])
        out = limiter(audio * db_to_lin(gain_db), sr)
        miss = cfg.target_lufs - loudness(out, sr)
        if abs(miss) < abs(best_miss):
            best, best_miss = out, miss
        # Sem ganho de loudness, empurrar mais só esmagaria os picos.
        if abs(miss) < 0.3 or (miss > 0 and best is not out):
            break
        gain_db += miss
    out = best
    # Garantia final contra estouro digital em qualquer amostra residual.
    return np.clip(out, -db_to_lin(cfg.ceiling_db), db_to_lin(cfg.ceiling_db)).astype(np.float32)


def process_audio(audio: np.ndarray, sr: int, cfg: ChainConfig | None = None) -> tuple[np.ndarray, ChainReport]:
    """Processa um array ``(canais, amostras)`` e devolve o resultado e um relatório."""
    cfg = cfg or ChainConfig()
    audio = np.atleast_2d(np.asarray(audio, dtype=np.float32))
    if audio.shape[0] > audio.shape[1]:
        audio = audio.T  # aceita também (amostras, canais)
    report = ChainReport(sample_rate=sr, channels=audio.shape[0],
                         input_lufs=loudness(audio, sr), output_lufs=0.0, output_peak_db=0.0)

    if cfg.tail_seconds > 0:
        audio = np.pad(audio, ((0, 0), (0, int(sr * cfg.tail_seconds))))
    audio = gain_to_lufs(audio, sr, cfg.input_lufs)
    report.stages.append("ajuste de entrada")

    if cfg.denoise:
        audio = denoise(audio, sr, cfg)
        report.stages.append("redução de ruído")
    if cfg.gate:
        audio, report.gate_threshold_db = gate(audio, sr, cfg)
        report.stages.append("gate")
    if cfg.eq:
        audio = equalize(audio, sr, cfg)
        report.stages.append("equalização")
    if cfg.deess:
        audio, report.deess_max_reduction_db, report.deess_active_percent = deess(audio, sr, cfg)
        report.stages.append("de-esser")
    if cfg.compress:
        audio = compress(audio, sr, cfg)
        report.stages.append("compressão")
    if cfg.saturate:
        audio = saturate(audio, sr, cfg)
        report.stages.append("saturação")
    if cfg.reverb or cfg.delay:
        audio = ambience(audio, sr, cfg)
        report.stages.append("reverb e delay")
    audio = finalize(audio, sr, cfg)
    report.stages.append("normalização e limiter")

    report.output_lufs = loudness(audio, sr)
    report.output_peak_db = lin_to_db(float(np.abs(audio).max(initial=0.0)))
    return audio, report


def process_file(src: str | Path, dst: str | Path, cfg: ChainConfig | None = None,
                 subtype: str = "PCM_24") -> ChainReport:
    data, sr = sf.read(str(src), dtype="float32", always_2d=True)  # (amostras, canais)
    out, report = process_audio(data.T, sr, cfg)
    Path(dst).parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(dst), out.T, sr, subtype=subtype)
    return report
