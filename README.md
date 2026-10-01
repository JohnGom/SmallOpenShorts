# OpenShorts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

**Free & open source AI video clipping.** Turn long-form videos — podcasts, webinars, livestreams, vlogs, interviews — into viral-ready 9:16 shorts for TikTok, Instagram Reels, and YouTube Shorts. Self-hosted with Docker. No watermarks, no limits.

This is a focused fork of [mutonby/openshorts](https://github.com/mutonby/openshorts) (MIT) that keeps only the core clipping pipeline: **clip generation + subtitles + text hooks**.

---

## Features

- **Viral clip detection** — Gemini reads the word-level transcript and picks the 3–15 most engaging moments (15–60 s each), with titles, captions and hook text.
- **Precise cutting** — FFmpeg extracts each clip at strict second-level timestamps.
- **Vertical reframing (9:16)** — subject tracking (MediaPipe + YOLOv8) for single speakers, blurred background layout for groups and landscapes.
- **Burned-in subtitles** — fonts, colors, outline or background box, top/middle/bottom positioning.
- **Viral hooks** — punchy text overlays with position, size and timed visibility.

## Quick Start

```bash
git clone <your-fork>
cd openshorts
docker compose up --build
```

- Frontend: http://localhost:5175
- Backend API: http://localhost:8000

1. Open **Settings** and paste your [Gemini API key](https://aistudio.google.com/app/apikey) (stored only in your browser).
2. Paste a YouTube URL or upload a video file, confirm you own the content, and process.
3. Preview the clips, add subtitles and hooks, download.

### Requirements

- Docker + Docker Compose
- A Google Gemini API key (free tier works)

## Development

```bash
# Frontend
cd dashboard && npm install && npm run dev    # port 5173
npm run build                                  # production build
npm run lint                                   # strict ESLint

# Backend
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Configuration

| Env var | Default | Purpose |
|---------|---------|---------|
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` | Gemini model for clip detection |
| `MAX_CONCURRENT_JOBS` | `5` | Concurrent processing jobs |
| `JOB_RETENTION_SECONDS` | `3600` | Job/file retention on disk |
| `DISABLE_YOUTUBE_URL` | `false` | Disable YouTube URL ingestion |
| `YOUTUBE_COOKIES` | — | Cookies file for yt-dlp (optional) |
| `AWS_*` | — | Optional silent S3 backup of job artifacts |

## How It Works

1. **Ingest** — YouTube download (yt-dlp) or local upload.
2. **Transcription** — faster-whisper with word-level timestamps.
3. **AI analysis** — Gemini identifies the viral moments (JSON mode with retries and robust parsing).
4. **Extraction** — FFmpeg cuts each clip precisely.
5. **Reframing** — 9:16 vertical crop with subject tracking or blurred background.
6. **Finishing** — optional burned-in subtitles and text hooks.

## License

MIT — see [LICENSE](LICENSE). Based on [mutonby/openshorts](https://github.com/mutonby/openshorts).
