import React from 'react';
import { Sparkles, Scissors, Subtitles, Type, ArrowRight, Shield } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="group bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
      <Icon size={24} className="text-primary" />
    </div>
    <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
    <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
      {number}
    </div>
    <div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function Landing({ onLaunchApp }) {
  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      {/* Nav */}
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border border-white/5">
              <img src="/logo-openshorts.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-lg tracking-tight">OpenShorts</span>
          </div>
          <button onClick={onLaunchApp} className="btn-primary text-sm flex items-center gap-2">
            Open the App <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] uppercase tracking-wider text-primary font-semibold">
            <Sparkles size={12} /> AI Video Clipping
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent leading-tight">
            Turn long videos into viral shorts
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Drop a YouTube link or upload a file. OpenShorts finds the most viral moments,
            cuts them into 9:16 clips and gives them titles, captions and hooks — ready to publish.
          </p>
          <button onClick={onLaunchApp} className="btn-primary text-base px-8 py-4 flex items-center gap-2 mx-auto">
            Start clipping <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-10">
        <h2 className="text-3xl font-bold text-center">How it works</h2>
        <div className="space-y-6">
          <StepCard number="1" title="Ingest" description="Download from YouTube or upload your own video file." />
          <StepCard number="2" title="Transcribe" description="Word-level transcription with Faster-Whisper." />
          <StepCard number="3" title="Find the viral moments" description="Gemini reads the transcript and picks the 3–15 most engaging clips, with titles, captions and hook text." />
          <StepCard number="4" title="Cut & reframe" description="FFmpeg extracts each clip and reframes it to vertical 9:16 with subject tracking or a blurred background layout." />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Scissors}
            title="Precise clip extraction"
            description="Cuts are aligned to natural pauses with strict second-level timestamps, between 15 and 60 seconds."
          />
          <FeatureCard
            icon={Subtitles}
            title="Burned-in subtitles"
            description="Style them your way: fonts, colors, outline or background box, positioned top, middle or bottom."
          />
          <FeatureCard
            icon={Type}
            title="Viral hooks"
            description="Add a punchy text overlay to stop the scroll, with control over position, size and duration."
          />
        </div>
      </section>

      {/* Privacy */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <div className="glass-panel p-8 flex items-start gap-4">
          <Shield size={24} className="text-primary shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Your keys stay in your browser</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              The Gemini API key is stored only in your browser and sent to the backend just to process
              your request. Nothing is stored server-side.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <p>OpenShorts — open source video clipping.</p>
          <div className="flex items-center gap-6">
            <a href="#legal" className="hover:text-white transition-colors">Terms & Privacy</a>
            <button onClick={onLaunchApp} className="hover:text-white transition-colors flex items-center gap-1">
              Open the App <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
