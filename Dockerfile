# Multi-stage build for smaller final image
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
# Copy and install Python dependencies
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg, OpenCV dependencies, and Node.js (for yt-dlp JS challenges)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Always upgrade yt-dlp to latest (YouTube bot-detection changes frequently)
RUN pip install --upgrade --no-cache-dir yt-dlp

# Copy application code
COPY . .

# Create a non-root user with a FIXED uid/gid (default 1000 = typical host user,
# e.g. "opc" on Oracle Cloud) so bind-mounted dirs (./output, ./uploads, repo)
# are writable from inside the container.
ARG APP_UID=1000
ARG APP_GID=1000
RUN groupadd -g ${APP_GID} appuser && useradd -u ${APP_UID} -g appuser -d /app -s /sbin/nologin appuser

# Create directories including Ultralytics cache config.
# /models lives OUTSIDE /app on purpose: compose bind-mounts the host repo over
# /app at runtime, which would hide anything baked under /app.
RUN mkdir -p /app/uploads /app/output /tmp/Ultralytics /models
# Fix permissions: /app for code/uploads, /tmp/Ultralytics for AI cache, /models for assets
RUN chown -R appuser:appuser /app /tmp/Ultralytics /models

# Switch to non-root user
USER appuser

# Pre-download YOLO model at build time, outside the bind mount so jobs never
# need to download it at runtime (would fail on read-only/foreign-uid mounts)
RUN python -c "from ultralytics import YOLO; YOLO('/models/yolov8n.pt')"

# Expose FastAPI port
EXPOSE 8000

# Run FastAPI app
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
