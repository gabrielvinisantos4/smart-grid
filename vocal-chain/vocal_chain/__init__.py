"""Cadeia de edição vocal: transforma uma gravação de voz em som de estúdio."""

from .chain import ChainConfig, process_audio, process_file
from .presets import PRESETS

__all__ = ["ChainConfig", "PRESETS", "process_audio", "process_file"]
