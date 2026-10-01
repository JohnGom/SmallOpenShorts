# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenShorts is an AI-powered vertical video generator that transforms long YouTube videos or local uploads into viral-ready short clips (9:16 format) for TikTok, Instagram Reels, and YouTube Shorts. Uses Google Gemini for viral moment detection and title generation.

This is a focused fork of https://github.com/mutonby/openshorts (MIT) that keeps only the core clipping pipeline: clip generation + subtitles + text hooks.

## Development Commands

### Local Development (Docker)
```bash
docker compose up --build   # Build and run full stack
```
- Backend: http://localhost:8000 (FastAPI/Uvicorn)
- Frontend: http://localhost:5175 (Vite proxies API calls to backend)

### Frontend Only (Dashboard)
```bash
cd dashboard
npm install
npm run dev       # Dev server with HMR (port 5173)
npm run build     # Production build
npm run lint      # ESLint (strict, --max-warnings 0)
```

### Backend Only
```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Architecture

### Core Processing Pipeline
1. **Ingest** - YouTube download (yt-dlp) or local upload
2. **Transcription** - faster-whisper with word-level timestamps
3. **AI Analysis** - Gemini identifies 3-15 viral moments (15-60 sec each) with JSON mode, retries with backoff, and robust JSON parsing
4. **FFmpeg Extraction** - Precise clip cutting
5. **AI Cropping** - Vertical reframing with subject tracking
6. **Subtitles** - Optional burned-in subtitles (SRT generation + FFmpeg burn)
7. **Hook Overlay** - Optional text overlays with styled fonts and timed visibility

### Key Files
| File | Purpose |
|------|---------|
| `main.py` | Core video processing: transcription, viral clip detection (Gemini), clip extraction, vertical reframing |
| `app.py` | FastAPI server with async job queue and REST endpoints |
| `subtitles.py` | SRT generation and FFmpeg subtitle burning (ffmpeg 8 compatible) |
| `hooks.py` | Hook text overlay generation with font rendering and timed overlay |
| `s3_uploader.py` | Optional silent S3 backup of job artifacts |
| `dashboard/src/App.jsx` | Main React component with state management |
| `dashboard/src/components/ResultCard.jsx` | Clip card: preview, subtitles, hook, download |

### Dual-Mode Video Reframing
- **TRACK Mode** (single subject): MediaPipe face detection + YOLOv8 fallback with "Heavy Tripod" stabilization
- **GENERAL Mode** (groups/landscapes): Blurred background layout preserving full width

### Key Classes
- `SmoothedCameraman` - Stabilized camera movement with safe zone logic (prevents jitter)
- `SpeakerTracker` - Prevents rapid speaker switching, handles temporary occlusions

### Gemini Integration
- Default model: `gemini-3.1-flash-lite`, overridable via `GEMINI_MODEL` env var
- JSON output forced with `response_mime_type="application/json"` and a rescue parser that extracts the outermost JSON object
- Transient errors (5xx/429/overloaded/empty body) retried up to 3 times with backoff (5s/10s); parse errors are retried too
- Content-policy blocks (`GeminiBlockedError`) fail fast without retries and with an honest message
- If clip detection fails, the job fails explicitly (no silent whole-video fallback)

### API Endpoints
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/config` | Frontend feature flags |
| POST | `/api/process` | Submit video for processing |
| GET | `/api/status/{job_id}` | Poll job status and logs |
| GET | `/api/clip/{job_id}/{clip_index}/transcript` | Word-level transcript of a clip |
| POST | `/api/subtitle` | Generate and apply burned-in subtitles |
| POST | `/api/hook` | Add text hook overlays (optional `duration_seconds`) |

### Concurrency Model
Async job queue with semaphore-based concurrency control. Configure via `MAX_CONCURRENT_JOBS` env var (default: 5). Jobs auto-cleanup after `JOB_RETENTION_SECONDS` (default: 1 hour).

## Environment Variables

**Server-side (.env):**
- `GEMINI_MODEL` - Gemini model override (default: `gemini-3.1-flash-lite`)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` - Optional S3 backup
- `MAX_CONCURRENT_JOBS` - Concurrent processing limit (default: 5)
- `JOB_RETENTION_SECONDS` - Job/file retention (default: 3600)
- `DISABLE_YOUTUBE_URL` - Set to `true` to disable YouTube URL ingestion
- `YOUTUBE_COOKIES` - Optional cookies file for yt-dlp
- `VITE_API_URL` - Production API URL override

**Client-side (localStorage):**
- `GEMINI_API_KEY` - Google Gemini API key (required, sent via `X-Gemini-Key` header per request)

> API keys are stored in the browser and sent via headers only when needed. Never stored server-side.

## Tech Stack
- **Backend:** Python 3.11, FastAPI, google-genai, faster-whisper, ultralytics (YOLOv8), mediapipe, opencv-python, yt-dlp, FFmpeg
- **Frontend:** React 18, Vite 4, Tailwind CSS 3.4
- **External APIs:** Google Gemini
- **Infrastructure:** Docker + Docker Compose, optional AWS S3
