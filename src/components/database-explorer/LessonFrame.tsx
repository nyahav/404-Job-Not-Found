import { motion } from 'framer-motion';
import { Pause, Play, RotateCcw, StepForward } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  eyebrow: string;
  description: string;
  why: string;
  isPlaying: boolean;
  complete: boolean;
  onToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  children: ReactNode;
}

export default function LessonFrame({
  title,
  eyebrow,
  description,
  why,
  isPlaying,
  complete,
  onToggle,
  onStep,
  onReset,
  children,
}: Props) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.22 }}
    >
      <header className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.18em] text-cyan-300 uppercase">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-3 leading-7 text-slate-400">{description}</p>
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${isPlaying ? 'animate-pulse bg-emerald-400' : 'bg-slate-600'}`}
            />
            {isPlaying ? 'SIMULATION RUNNING' : complete ? 'SCENARIO COMPLETE' : 'READY'}
          </div>
          <div aria-label={`${title} playback controls`} className="flex items-center gap-2">
            <button
              aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={complete && !isPlaying}
              onClick={onToggle}
              type="button"
            >
              {isPlaying ? (
                <Pause aria-hidden="true" size={15} />
              ) : (
                <Play aria-hidden="true" size={15} />
              )}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              aria-label="Advance one step"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              disabled={complete}
              onClick={onStep}
              type="button"
            >
              <StepForward aria-hidden="true" size={15} />
              <span className="hidden sm:inline">Step</span>
            </button>
            <button
              aria-label="Reset simulation"
              className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
              onClick={onReset}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={15} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">{children}</div>
      </div>

      <aside className="rounded-xl border border-amber-400/15 bg-amber-400/[0.04] p-4 sm:p-5">
        <p className="font-mono text-xs tracking-wider text-amber-300 uppercase">
          Why it matters in production
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{why}</p>
      </aside>
    </motion.section>
  );
}
