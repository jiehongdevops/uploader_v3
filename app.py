import os
import time
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_UPLOAD_DIR = BASE_DIR / "uploads"

app = Flask(__name__)


def _get_max_content_length():
    value = os.getenv("MAX_CONTENT_LENGTH", "").strip()
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


max_length = _get_max_content_length()
if max_length:
    app.config["MAX_CONTENT_LENGTH"] = max_length


def _ensure_upload_dir():
    upload_dir = Path(os.getenv("UPLOAD_DIR", str(DEFAULT_UPLOAD_DIR)))
    upload_dir.mkdir(parents=True, exist_ok=True)
    return upload_dir


def _unique_path(upload_dir: Path, filename: str) -> Path:
    candidate = upload_dir / filename
    if not candidate.exists():
        return candidate
    stem = candidate.stem
    suffix = candidate.suffix
    for idx in range(1, 10000):
        attempt = upload_dir / f"{stem}_{idx}{suffix}"
        if not attempt.exists():
            return attempt
    timestamp = int(time.time())
    return upload_dir / f"{stem}_{timestamp}{suffix}"


@app.get("/")
def index():
    return render_template("index.html")


@app.get("/healthz")
def healthz():
    return "ok"


@app.post("/upload")
def upload():
    upload_dir = _ensure_upload_dir()
    files = request.files.getlist("files")
    if not files:
        return jsonify({"ok": False, "error": "no files"}), 400

    saved = []
    for f in files:
        original = secure_filename(f.filename or "")
        if not original:
            original = f"upload_{int(time.time())}"
        target = _unique_path(upload_dir, original)
        f.save(target)
        saved.append(
            {
                "filename": target.name,
                "size": target.stat().st_size,
            }
        )

    return jsonify({"ok": True, "files": saved})


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    app.run(host=host, port=port)
