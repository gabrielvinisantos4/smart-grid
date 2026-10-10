#!/usr/bin/env python3
"""Processa um WAV de voz para soar como gravação de estúdio.

Exemplos:
    python process_vocal.py entrada.wav saida.wav
    python process_vocal.py entrada.wav saida.wav --preset podcast
    python process_vocal.py entrada.wav saida.wav --sem reverb delay --set target_lufs=-14
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import asdict, fields
from pathlib import Path

from vocal_chain import PRESETS, ChainConfig, process_file

STAGES = ["denoise", "gate", "eq", "deess", "compress", "saturate", "reverb", "delay"]


def parse_value(raw: str, current):
    if isinstance(current, bool):
        if raw.lower() in {"1", "true", "sim", "on"}:
            return True
        if raw.lower() in {"0", "false", "nao", "não", "off"}:
            return False
        raise ValueError(f"valor booleano inválido: {raw}")
    return type(current)(raw)


def build_config(args: argparse.Namespace) -> ChainConfig:
    cfg = ChainConfig().updated(**PRESETS[args.preset])
    overrides: dict = {}
    for stage in args.sem or []:
        overrides[stage] = False
    if args.target_lufs is not None:
        overrides["target_lufs"] = args.target_lufs
    defaults = asdict(cfg)
    for item in args.set or []:
        key, _, raw = item.partition("=")
        if key not in defaults:
            raise SystemExit(f"parâmetro desconhecido: {key} (veja --listar)")
        overrides[key] = parse_value(raw, defaults[key])
    return cfg.updated(**overrides)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("entrada", nargs="?", type=Path, help="arquivo de voz (WAV, FLAC, AIFF...)")
    p.add_argument("saida", nargs="?", type=Path, help="WAV processado")
    p.add_argument("--preset", choices=sorted(PRESETS), default="natural")
    p.add_argument("--target-lufs", type=float, help="loudness final (padrão -16 LUFS)")
    p.add_argument("--sem", nargs="+", choices=STAGES, metavar="ETAPA",
                   help=f"desliga etapas: {', '.join(STAGES)}")
    p.add_argument("--set", action="append", metavar="CHAVE=VALOR",
                   help="ajusta qualquer parâmetro, ex.: --set comp_ratio=4")
    p.add_argument("--bits", choices=["16", "24", "32f"], default="24")
    p.add_argument("--listar", action="store_true", help="mostra todos os parâmetros e sai")
    args = p.parse_args(argv)

    if args.listar:
        cfg = build_config(args)
        for f in fields(cfg):
            print(f"{f.name:24} {getattr(cfg, f.name)}")
        return 0
    if not args.entrada or not args.saida:
        p.error("informe o arquivo de entrada e o de saída")
    if not args.entrada.exists():
        p.error(f"arquivo não encontrado: {args.entrada}")

    subtype = {"16": "PCM_16", "24": "PCM_24", "32f": "FLOAT"}[args.bits]
    report = process_file(args.entrada, args.saida, build_config(args), subtype=subtype)

    print(f"✓ {args.saida}  ({report.sample_rate} Hz, {report.channels} canal(is))")
    print(f"  etapas: {' → '.join(report.stages)}")
    if report.gate_threshold_db is not None:
        print(f"  gate: limiar {report.gate_threshold_db:.1f} dBFS")
    print(f"  de-esser: até {report.deess_max_reduction_db:.1f} dB, "
          f"ativo em {report.deess_active_percent:.0f}% do tempo")
    print(f"  loudness: {report.input_lufs:.1f} → {report.output_lufs:.1f} LUFS, "
          f"pico {report.output_peak_db:.1f} dBFS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
