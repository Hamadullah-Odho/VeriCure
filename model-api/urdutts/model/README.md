---
language: ur
tags:
  - piper
  - tts
  - urdu
  - text-to-speech
  - accessibility
license: mit
---

# ur_PK-aegis_female-medium

Female Urdu Piper TTS voice (medium quality), part of the **Aegis** Urdu TTS pipeline.
Complements the male Urdu voice **Fasih** with a female option.


| | |
|---|---|
| Language | Urdu (`ur_PK`) |
| Gender | Female |
| Quality | Medium |
| Sample rate | 22050 Hz |
| Phonemizer | eSpeak (`ur`) |

---

## Files
```text
ur_PK-aegis_female-medium.onnx
ur_PK-aegis_female-medium.onnx.json
samples/speaker_0.mp3
```

---

## Usage
```bash
echo 'یہ ایک سادہ جملہ ہے۔' | piper \
  --model ur_PK-aegis_female-medium.onnx \
  --config ur_PK-aegis_female-medium.onnx.json \
  --output_file output.wav
```

Local paths:
```bash
piper \
  --model ./ur_PK-aegis_female-medium.onnx \
  --config ./ur_PK-aegis_female-medium.onnx.json \
  --output_file output.wav
```

---

## Training (short)
- Fine-tuned from **Fasih** Urdu male checkpoint
- Phonemes: eSpeak-ng `ur` IPA
- Part of the [aegis-tts](https://huggingface.co/mahwizzzz) training pipeline

---

## Base Model & Provenance

This voice is fine-tuned from **Fasih** (`ur_PK-male-medium`) by [IhorShevchuk](https://huggingface.co/IhorShevchuk), available at:
https://huggingface.co/IhorShevchuk/piper-voice-ur-fasih

Fasih was itself trained from a Hindi (`hi_IN`) medium checkpoint (Rohan), via `rhasspy/piper-checkpoints`.

## Attribution

This model is licensed under MIT, which **requires retaining this copyright and license notice in all copies or substantial portions of the work**, including redistributions and re-uploads.

If you use, fine-tune, or redistribute this model, please retain attribution to:

> Muhammad Mahwiz Khalil (Proxima AI) — https://huggingface.co/mahwizzzz

Re-uploading this model without attribution is a violation of the MIT license terms.

## Citation

```bibtex
@misc{aegis_urdu_tts_2026,
  author    = {Khalil, Muhammad Mahwiz},
  title     = {Aegis: Female Urdu Piper TTS Voice (ur_PK-aegis_female-medium)},
  year      = {2026},
  publisher = {Hugging Face},
  url       = {https://huggingface.co/mahwizzzz/piper-voice-ur-aegis-female}
}
```

---

## License

MIT Copyright (c) 2026 Muhammad Mahwiz Khalil (Proxima AI).
See the [LICENSE](https://huggingface.co/mahwizzzz/piper-voice-ur-aegis-female/blob/main/LICENSE) file for full terms. The copyright notice above must be preserved in any copy or redistribution of this model.