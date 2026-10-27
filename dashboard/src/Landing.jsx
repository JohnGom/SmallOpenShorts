import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Scissors, Subtitles, Type, Shield, Github } from 'lucide-react';

const HLS_SRC = 'https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBsTwaxU.m3u8';
const GITHUB_URL = 'https://github.com/JohnGom/SmallOpenShorts';

function HlsVideoBackground() {
  const videoRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Respect reduced-motion: keep the poster frame, never play.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReady(true);
      return;
    }

    let hls = null;
    let cancelled = false;

    const reveal = () => { if (!cancelled) setReady(true); };
    // Reveal even if the stream stalls, so the black backdrop shows.
    const fallbackTimer = setTimeout(reveal, 6000);
    video.addEventListener('canplay', reveal);
    video.addEventListener('error', reveal);

    // Prefer hls.js (MSE) whenever supported: Chromium's *native* HLS demuxer
    // refuses the stream on plain-HTTP pages ("insecure media request"), while
    // hls.js fetches segments via XHR and avoids the media stack entirely.
    // Native playback (Safari) is only the last-resort fallback.
    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return;

      if (Hls.isSupported()) {
        hls = new Hls({ capLevelToPlayerSize: true, startLevel: -1 });
        hls.loadSource(HLS_SRC);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('[landing] fatal HLS error:', data.type, data.details);
            hls?.destroy();
            hls = null;
            reveal();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = HLS_SRC;
        video.play().catch(() => {});
      } else {
        reveal();
      }
    }).catch((err) => {
      console.error('[landing] failed to load hls.js:', err);
      reveal();
    });

    return () => {
      cancelled = true;
      clearTimeout(fallbackTimer);
      video.removeEventListener('canplay', reveal);
      video.removeEventListener('error', reveal);
      hls?.destroy();
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black" aria-hidden="true">
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        className={`h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
      {/* Legibility scrims: heavy bottom-left, soft everywhere else */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/45" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55))]" />
    </div>
  );
}

function GlassHeader({ onLaunchApp }) {
  return (
    <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-white/[0.06] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5">
            <img src="/logo-openshorts.png" alt="" className="h-full w-full object-cover" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">OpenShorts</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#how" className="transition-colors hover:text-white">How it works</a>
          <a href="#features" className="transition-colors hover:text-white">Features</a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-colors hover:text-white"
          >
            <Github size={15} /> GitHub
          </a>
        </nav>

        <button
          onClick={onLaunchApp}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
        >
          Open the App
        </button>
      </div>
    </header>
  );
}

const PIPELINE_STEPS = [
  { n: '01', title: 'Ingest', text: 'Paste a YouTube link or upload a file straight from your machine.' },
  { n: '02', title: 'Transcribe', text: 'Faster-Whisper extracts every word with frame-accurate timestamps.' },
  { n: '03', title: 'Find the viral moments', text: 'Gemini reads the transcript and picks the 3–15 most engaging beats — with titles, captions and hook text already written.' },
  { n: '04', title: 'Cut & reframe', text: 'FFmpeg extracts each clip and reframes it to vertical 9:16, tracking the speaker or blurring the background.' },
];

const FEATURES = [
  { icon: Scissors, title: 'Precise clip extraction', text: 'Cuts land on natural pauses with strict second-level timestamps, between 15 and 60 seconds.' },
  { icon: Subtitles, title: 'Burned-in subtitles', text: 'Fonts, colors, outline or background box — positioned top, middle or bottom.' },
  { icon: Type, title: 'Viral hooks', text: 'A punchy text overlay to stop the scroll, with control over position, size and duration.' },
];

export default function Landing({ onLaunchApp }) {
  return (
    <div className="min-h-screen selection:bg-primary/30">
      <HlsVideoBackground />
      <GlassHeader onLaunchApp={onLaunchApp} />

      {/* Hero — bottom-left over the video */}
      <section className="relative flex min-h-[100dvh] flex-col justify-end">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16 md:pb-24">
          <div className="max-w-3xl space-y-7">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-white/90 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-slow" />
              Open source · Self-hosted
            </p>

            <h1 className="font-display text-[clamp(3rem,8.5vw,6.75rem)] leading-[0.95] tracking-tight text-white">
              Turn long videos<br />
              into <em className="italic">viral</em> shorts
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
              Drop in a YouTube link or upload a file. Gemini finds the moments worth cutting,
              reframes them 9:16, and dresses them with captions and hooks — ready to publish.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onLaunchApp}
                className="group flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]"
              >
                Start clipping
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 active:scale-[0.98]"
              >
                <Github size={16} />
                View on GitHub
              </a>
            </div>

            <p className="pt-3 text-[11px] font-medium uppercase tracking-[0.3em] text-white/40">
              Whisper → Gemini → FFmpeg → 9:16
            </p>
          </div>
        </div>
      </section>

      {/* Content scrolls over the fixed video */}
      <div className="relative z-10 border-t border-white/10 bg-background">
        {/* How it works — editorial numbered rows */}
        <section id="how" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:py-28">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">The pipeline</p>
          <h2 className="font-display mb-12 text-4xl tracking-tight text-white md:text-5xl">How it works</h2>
          <div className="border-t border-white/10">
            {PIPELINE_STEPS.map((step) => (
              <div
                key={step.n}
                className="grid grid-cols-1 gap-2 border-b border-white/10 py-7 md:grid-cols-[5rem_14rem_1fr] md:gap-8 md:py-9"
              >
                <span className="font-mono text-sm text-primary md:pt-1">{step.n}</span>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features — hairline columns */}
        <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-20 md:pb-28">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">Finishing touches</p>
          <h2 className="font-display mb-12 text-4xl tracking-tight text-white md:text-5xl">Everything the clip needs</h2>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group bg-background p-8 transition-colors hover:bg-surface/60">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon size={20} className="text-primary" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-zinc-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="mx-auto max-w-3xl px-6 pb-20 md:pb-28">
          <div className="glass-panel flex items-start gap-4 p-8">
            <Shield size={22} className="mt-0.5 shrink-0 text-primary" />
            <div>
              <h3 className="mb-2 text-base font-semibold text-white">Your keys stay in your browser</h3>
              <p className="text-sm leading-relaxed text-zinc-400">
                The Gemini API key is stored only in your browser and sent to the backend just to
                process your request. Nothing is stored server-side.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
            <p>OpenShorts — open source video clipping.</p>
            <div className="flex items-center gap-6">
              <a href="#legal" className="transition-colors hover:text-white">Terms &amp; Privacy</a>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-white"
              >
                GitHub
              </a>
              <button onClick={onLaunchApp} className="flex items-center gap-1 transition-colors hover:text-white">
                Open the App <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
