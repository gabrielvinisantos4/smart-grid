"""Presets prontos. Cada um altera só o que difere do padrão de ChainConfig."""

PRESETS: dict[str, dict] = {
    # Voz falada limpa e natural (locução, narração, vídeos).
    "natural": {},
    # Podcast / rádio: mais compressão e presença, quase sem ambiência.
    "podcast": {
        "comp_threshold_db": -24.0,
        "comp_ratio": 4.0,
        "presence_db": 3.5,
        "sat_drive_db": 8.0,
        "reverb_send_db": -28.0,
        "delay": False,
        "target_lufs": -16.0,
    },
    # Voz cantada: mais ar, reverb e delay audíveis, loudness de streaming.
    "canto": {
        "air_db": 4.0,
        "comp_ratio": 3.5,
        "reverb_send_db": -14.0,
        "reverb_room": 0.35,
        "delay_send_db": -20.0,
        "delay_ms": 140.0,
        "target_lufs": -14.0,
    },
    # Só limpeza: ruído, gate, EQ, de-esser e nível, sem efeitos de cor.
    "limpo": {
        "saturate": False,
        "reverb": False,
        "delay": False,
    },
}
