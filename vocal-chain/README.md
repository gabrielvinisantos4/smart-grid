# Cadeia de edição vocal

Transforma uma gravação de voz em som de estúdio com um comando:

```bash
cd vocal-chain
python3 -m pip install -r requirements.txt
python3 process_vocal.py minha_voz.wav minha_voz_estudio.wav
```

Aceita WAV, FLAC ou AIFF, mono ou estéreo, em qualquer taxa de amostragem. A saída é um WAV de 24 bits na mesma taxa e com o mesmo número de canais.

## O que acontece com a voz

| # | Etapa | Como | Padrão |
|---|-------|------|--------|
| 1 | Ajuste de entrada | Leva a gravação a -23 LUFS para os limiares abaixo valerem para qualquer microfone | -23 LUFS |
| 2 | Redução de ruído | Subtração espectral (`noisereduce`) do ruído constante: ar-condicionado, chiado, zumbido | remove 85% |
| 3 | Gate | Expansor (`pedalboard.NoiseGate`) com limiar medido no piso de ruído da própria gravação | piso + 6 dB, razão 4:1 |
| 4 | Equalização | Passa-altas, corte de "embolado", presença e ar | 80 Hz HPF, -3 dB em 300 Hz, +2,5 dB em 3,5 kHz, +3 dB acima de 10 kHz |
| 5 | De-esser | Divisão de bandas de fase zero; só a banda acima de 5,5 kHz é atenuada quando os "s" passam do nível da voz | até 10 dB |
| 6 | Compressão | `pedalboard.Compressor` | -20 dB, 3:1, 8 ms / 120 ms |
| 7 | Saturação leve | `tanh` com sobreamostragem 4x, misturada ao sinal seco | +6 dB de drive, 35% |
| 8 | Reverb e delay curtos | Envios paralelos filtrados (200 Hz a 7 kHz), o sinal seco fica intacto | sala pequena a -18 dB, slapback de 110 ms a -24 dB |
| 9 | Normalização e limiter | Ganho até a loudness alvo e limiter brickwall de true peak, reajustados até bater o alvo | -16 LUFS, teto -1 dBTP |

Ao final, 0,6 s de cauda é acrescentado para o reverb não cortar seco.

## Presets

```bash
python3 process_vocal.py voz.wav saida.wav --preset podcast
```

- `natural` (padrão): locução, narração e vídeos.
- `podcast`: mais compressão e presença, quase sem ambiência.
- `canto`: mais ar, reverb e delay audíveis, -14 LUFS para streaming.
- `limpo`: só limpeza (ruído, gate, EQ, de-esser, nível), sem saturação nem ambiência.

## Ajustes finos

```bash
python3 process_vocal.py voz.wav saida.wav --sem reverb delay       # desliga etapas
python3 process_vocal.py voz.wav saida.wav --target-lufs -14         # loudness final
python3 process_vocal.py voz.wav saida.wav --set comp_ratio=4 --set air_db=2
python3 process_vocal.py --listar                                    # todos os parâmetros
python3 process_vocal.py voz.wav saida.wav --bits 16                 # 16, 24 ou 32f
```

Se o gate estiver cortando o fim de palavras baixas, diminua `gate_above_floor_db` (ou use `--sem gate`). Se a voz ficar "metálica", reduza `denoise_amount` para 0,6.

Pelo Python:

```python
from vocal_chain import ChainConfig, PRESETS, process_file

cfg = ChainConfig().updated(**PRESETS["podcast"], target_lufs=-14)
report = process_file("voz.wav", "saida.wav", cfg)
print(report.output_lufs, report.output_peak_db)
```

## Testes

```bash
python3 make_test_voice.py exemplo.wav    # voz sintética com ruído, zumbido e sibilantes
python3 process_vocal.py exemplo.wav exemplo_estudio.wav
python3 -m pip install pytest && python3 -m pytest -q tests
```
