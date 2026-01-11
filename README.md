# Simple Photo Uploader

Minimal self-hosted uploader for bulk photo uploads from a phone browser to a Linux machine.

## Quick start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open `http://YOUR_DOMAIN_OR_IP:8000` on your phone and upload.

## Notes for large uploads

- For production, run behind a reverse proxy and disable body size limits.
- Example for Nginx:

```
client_max_body_size 0;
```

## Configuration

Environment variables:

- `HOST` (default `0.0.0.0`)
- `PORT` (default `8000`)
- `UPLOAD_DIR` (default `./uploads`)
- `MAX_CONTENT_LENGTH` (bytes, optional; leave unset for no limit)
