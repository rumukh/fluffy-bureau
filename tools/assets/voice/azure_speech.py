"""Shared Azure Speech helpers for Fluffy Bureau voice tooling.

Credentials: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION, or the signed-in Azure CLI.
Keys are only held in memory and are never written to disk or logs.
"""
from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

import azure.cognitiveservices.speech as sdk

DEFAULT_REGION = "swedencentral"


def _az(*args: str):
    exe = shutil.which("az.cmd") or shutil.which("az")
    if not exe:
        raise RuntimeError("Azure CLI unavailable")
    done = subprocess.run([exe, *args, "-o", "json"], capture_output=True, text=True, encoding="utf-8")
    if done.returncode:
        raise RuntimeError("Azure CLI request failed")
    return json.loads(done.stdout)


_CACHE: tuple[str, str] | None = None


def credentials(region: str = DEFAULT_REGION) -> tuple[str, str]:
    global _CACHE
    if _CACHE:
        return _CACHE
    if os.environ.get("AZURE_SPEECH_KEY") and os.environ.get("AZURE_SPEECH_REGION"):
        _CACHE = (os.environ["AZURE_SPEECH_REGION"], os.environ["AZURE_SPEECH_KEY"])
        return _CACHE
    accounts = [a for a in _az("cognitiveservices", "account", "list")
                if a.get("kind") in {"AIServices", "SpeechServices"} and a.get("location", "").lower() == region]
    if len(accounts) != 1:
        raise RuntimeError(f"Expected one Speech resource in {region}, found {len(accounts)}")
    acc = accounts[0]
    keys = _az("cognitiveservices", "account", "keys", "list", "--resource-group", acc["resourceGroup"], "--name", acc["name"])
    _CACHE = (acc["location"], keys["key1"])
    return _CACHE


def synthesize(ssml: str, out_wav: Path) -> dict:
    """Synthesize SSML to a 24 kHz mono WAV. Returns viseme and word events (seconds)."""
    region, key = credentials()
    out_wav.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        cfg = sdk.SpeechConfig(subscription=key, region=region)
        cfg.set_speech_synthesis_output_format(sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm)
        syn = sdk.SpeechSynthesizer(speech_config=cfg, audio_config=sdk.audio.AudioOutputConfig(filename=str(out_wav)))
        visemes: list[tuple[float, int]] = []
        words: list[dict] = []
        syn.viseme_received.connect(lambda e: visemes.append((e.audio_offset / 1e7, e.viseme_id)))
        syn.synthesis_word_boundary.connect(lambda e: words.append({
            "t": e.audio_offset / 1e7, "d": e.duration.total_seconds(), "text": e.text,
            "type": str(e.boundary_type).split(".")[-1]}))
        result = syn.speak_ssml_async(ssml).get()
        del syn
        if result.reason == sdk.ResultReason.SynthesizingAudioCompleted:
            return {"visemes": visemes, "words": words}
        detail = result.cancellation_details.error_details if result.cancellation_details else "unknown"
        if attempt < 3 and ("429" in detail or "Timeout" in detail or "busy" in detail.lower()):
            time.sleep(5 * (attempt + 1))
            continue
        raise RuntimeError(f"Synthesis failed: {detail[:300]}")
    raise RuntimeError("Synthesis failed after retries")


def assess(audio: Path, reference_text: str | None, language: str = "ru-RU") -> dict:
    """Azure short-audio REST recognition, optionally with pronunciation assessment."""
    region, key = credentials()
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-i", str(audio), "-ac", "1", "-ar", "16000",
                          "-c:a", "pcm_s16le", "-f", "wav", "pipe:1"], capture_output=True, check=True).stdout
    headers = {"Ocp-Apim-Subscription-Key": key, "Accept": "application/json",
               "Content-Type": "audio/wav; codecs=audio/pcm; samplerate=16000"}
    if reference_text:
        cfg = {"ReferenceText": reference_text, "GradingSystem": "HundredMark", "Granularity": "Word",
               "Dimension": "Comprehensive", "EnableMiscue": True}
        headers["Pronunciation-Assessment"] = base64.b64encode(json.dumps(cfg, ensure_ascii=False).encode()).decode()
    url = (f"https://{region}.stt.speech.microsoft.com/speech/recognition/conversation/"
           f"cognitiveservices/v1?language={language}&format=detailed")
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, data=pcm, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=60) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            break
        except urllib.error.HTTPError as err:
            if err.code in (429, 500, 502, 503, 504) and attempt < 3:
                time.sleep(4 * (attempt + 1))
                continue
            raise
        except (TimeoutError, urllib.error.URLError, ConnectionError):
            if attempt < 3:
                time.sleep(5 * (attempt + 1))
                continue
            raise
    best = (payload.get("NBest") or [{}])[0]
    pa = best.get("PronunciationAssessment") or best
    return {
        "status": payload.get("RecognitionStatus"),
        "display": payload.get("DisplayText", ""),
        "accuracy": pa.get("AccuracyScore"),
        "fluency": pa.get("FluencyScore"),
        "completeness": pa.get("CompletenessScore"),
        "pron": pa.get("PronScore"),
        "words": [{"word": w.get("Word"), "acc": (w.get("PronunciationAssessment") or {}).get("AccuracyScore"),
                   "err": (w.get("PronunciationAssessment") or {}).get("ErrorType")} for w in best.get("Words", [])],
    }
