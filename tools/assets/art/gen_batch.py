"""Run azure-image-generation jobs in parallel and keep each result JSON as provenance.

Usage: python gen_batch.py jobs.json [--workers 4]
jobs.json: [{"id", "prompt_file", "out", "size", "quality", "refs": [...], "mask": null,
            "count": 1, "background": null}]
Outputs and provenance live outside the repository (T20).
"""
import argparse, json, re, subprocess, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

HELPER = Path.home() / ".copilot/skills/azure-image-generation/scripts/generate-image.ps1"


def run(job):
    out = Path(job["out"])
    prov = out.with_suffix(".json")
    if prov.exists() and not job.get("force"):
        return job["id"], "skip"
    q = lambda s: "'" + str(s).replace("'", "''") + "'"
    cmd = (f"& {q(HELPER)} -PromptFile {q(job['prompt_file'])} -Size {job.get('size', '1024x1024')}"
           f" -Quality {job.get('quality', 'medium')} -OutputPath {q(out)} -Count {job.get('count', 1)}")
    if job.get("refs"):
        cmd += " -ReferenceImage @(" + ",".join(q(r) for r in job["refs"]) + ")"
    if job.get("mask"):
        cmd += f" -Mask {q(job['mask'])}"
    if job.get("background"):
        cmd += f" -Background {job['background']}"
    if job.get("force"):
        cmd += " -Force"
    args = ["pwsh", "-NoProfile", "-Command", cmd]
    out.parent.mkdir(parents=True, exist_ok=True)
    err = ""
    for attempt in range(10):
        done = subprocess.run(args, capture_output=True, text=True, encoding="utf-8", errors="replace")
        text = done.stdout.strip()
        start = text.find("{")
        if done.returncode == 0 and start >= 0:
            data = json.loads(text[start:])
            data["job"] = job
            prov.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
            return job["id"], "ok"
        err = (done.stderr or text)[-400:]
        wait = re.search(r"retry after (\d+) seconds", done.stderr + text)
        if wait or "429" in err or "rate limit" in err.lower():
            time.sleep((int(wait.group(1)) if wait else 30) + 5)
            continue
        if attempt >= 2:
            break
        time.sleep(10)
    return job["id"], "FAIL " + err


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("jobs")
    ap.add_argument("--workers", type=int, default=4)
    a = ap.parse_args()
    jobs = json.loads(Path(a.jobs).read_text(encoding="utf-8"))
    with ThreadPoolExecutor(a.workers) as ex:
        for jid, status in ex.map(run, jobs):
            print(jid, status, flush=True)


if __name__ == "__main__":
    main()


