"""Screen Azure voices for Russian accuracy (accent check) before casting."""
import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from azure_speech import synthesize, assess

VOICES = Path(sys.argv[1])
OUT = Path(sys.argv[2])
TEXT = "Смотри-ка: крошки ведут к пекарне, а запах — к рябине. Что пахнет правдой?"
voices = json.loads(VOICES.read_text(encoding="utf-8"))
cands = [v["ShortName"] for v in voices if v.get("VoiceType") == "Neural" and v.get("Status") == "GA"
         and ":" not in v["ShortName"] and (v["Locale"] == "ru-RU" or "ru-RU" in (v.get("SecondaryLocaleList") or []))]
rows = []
for name in cands:
    wav = OUT / f"{name}.wav"
    ssml = (f'<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="ru-RU"><voice name="{name}">'
            f'<lang xml:lang="ru-RU">{TEXT}</lang></voice></speak>')
    try:
        ev = synthesize(ssml, wav)
        a = assess(wav, TEXT)
        rows.append({"voice": name, "acc": a["accuracy"], "flu": a["fluency"], "pron": a["pron"], "visemes": len(ev["visemes"]), "heard": a["display"]})
    except Exception as e:  # noqa: BLE001
        rows.append({"voice": name, "error": str(e)[:120]})
    print(json.dumps(rows[-1], ensure_ascii=False), flush=True)
(OUT / "screen.json").write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8")
