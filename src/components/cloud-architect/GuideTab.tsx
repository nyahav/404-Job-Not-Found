import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Lightbulb,
  Trophy,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ArchitectureProject, GuideStep } from './types';

type LessonView = 'overview' | 'commands' | 'concepts' | 'tradeoffs';

const lessonTabs: { id: LessonView; label: string; icon: typeof BookOpen }[] = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'commands', label: 'Commands', icon: Code2 },
  { id: 'concepts', label: 'Concepts', icon: Lightbulb },
  { id: 'tradeoffs', label: 'Trade-offs', icon: BarChart3 },
];

export default function GuideTab({ project }: { project: ArchitectureProject }) {
  const steps = project.guide_steps;
  const storageKey = `cloud-architect-guide-${project.id}`;
  const [activeId, setActiveId] = useState(steps[0]?.id ?? 0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [lessonView, setLessonView] = useState<LessonView>('overview');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.every((id) => typeof id === 'number')) {
          setCompleted(parsed);
        }
      }
    } catch (error) {
      console.error('Unable to restore Cloud Architect guide progress.', error);
    }
    setStorageReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (storageReady) {
      window.localStorage.setItem(storageKey, JSON.stringify(completed));
    }
  }, [completed, storageKey, storageReady]);

  useEffect(() => {
    setLessonView('overview');
  }, [activeId]);

  const activeIndex = steps.findIndex((step) => step.id === activeId);
  const step = steps[activeIndex];
  const progress = steps.length ? (completed.length / steps.length) * 100 : 0;
  const completeStep = () => {
    setCompleted((current) =>
      current.includes(activeId) ? current : [...current, activeId].sort((a, b) => a - b),
    );
    if (activeIndex < steps.length - 1) setActiveId(steps[activeIndex + 1].id);
  };
  const completedAll = steps.length > 0 && completed.length === steps.length;

  if (!step) {
    return (
      <p className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-300">
        No guide content is available for this architecture.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <BookOpen aria-hidden="true" className="text-cyan-300" size={16} />
            Guide progress
          </div>
          <span className="text-sm text-slate-400">
            {completed.length} / {steps.length} steps complete
          </span>
        </div>
        <div
          aria-label={`${Math.round(progress)}% complete`}
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"
          role="progressbar"
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={Math.round(progress)}
        >
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
          />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav
          aria-label="Guide steps"
          className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-3 lg:flex-col lg:overflow-visible"
        >
          {steps.map((item, index) => {
            const active = item.id === activeId;
            const done = completed.includes(item.id);

            return (
              <button
                aria-current={active ? 'step' : undefined}
                className={`flex min-w-52 items-center gap-3 rounded-xl border p-3 text-left transition lg:min-w-0 ${
                  active
                    ? 'border-cyan-400/30 bg-cyan-400/10 text-white'
                    : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                key={item.id}
                onClick={() => setActiveId(item.id)}
                type="button"
              >
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                    done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {done ? <Check aria-hidden="true" size={15} /> : index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {done ? 'Completed' : `Step ${index + 1}`}
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
          <header className="border-b border-slate-800 pb-5">
            <p className="text-xs font-medium tracking-[0.18em] text-cyan-300 uppercase">
              Step {activeIndex + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">{step.title}</h2>
            <p className="mt-2 leading-7 text-slate-300">{step.summary}</p>
          </header>

          <div
            aria-label={`${step.title} lesson sections`}
            className="my-5 flex flex-wrap gap-2"
            role="tablist"
          >
            {lessonTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  aria-selected={lessonView === tab.id}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    lessonView === tab.id
                      ? 'bg-cyan-400/10 text-cyan-200'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  key={tab.id}
                  onClick={() => setLessonView(tab.id)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <LessonContent step={step} view={lessonView} />

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-5">
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeIndex === 0}
              onClick={() => setActiveId(steps[activeIndex - 1].id)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={16} /> Previous
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                completed.includes(activeId)
                  ? 'bg-emerald-400/10 text-emerald-200'
                  : 'bg-cyan-400 text-slate-950 hover:bg-cyan-300'
              }`}
              onClick={completeStep}
              type="button"
            >
              {completed.includes(activeId) ? (
                <CheckCircle2 aria-hidden="true" size={16} />
              ) : (
                <Check aria-hidden="true" size={16} />
              )}
              {completed.includes(activeId) ? 'Completed' : 'Mark as done'}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={activeIndex === steps.length - 1}
              onClick={() => setActiveId(steps[activeIndex + 1].id)}
              type="button"
            >
              Next <ChevronRight aria-hidden="true" size={16} />
            </button>
          </div>
        </section>
      </div>

      {completedAll && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-5 text-emerald-100"
          initial={{ opacity: 0, y: 5 }}
        >
          <Trophy aria-hidden="true" className="text-emerald-300" size={22} />
          <p>
            <span className="font-semibold">Guide complete!</span> You have finished all{' '}
            {steps.length} steps. Your progress is saved on this device.
          </p>
        </motion.div>
      )}
    </div>
  );
}

function LessonContent({ step, view }: { step: GuideStep; view: LessonView }) {
  const [copied, setCopied] = useState(false);
  const content = step.content;

  useEffect(() => {
    setCopied(false);
  }, [step.id, view]);

  const copyCode = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error('Unable to copy the guide command to the clipboard.', error);
    }
  };

  if (view === 'overview') {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 leading-8 text-slate-200">
          {content.intro}
        </p>
        {content.whyThis && (
          <aside className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-200">
              <Lightbulb aria-hidden="true" size={15} /> Why this choice?
            </h3>
            <p className="mt-2 leading-7 text-slate-300">{content.whyThis}</p>
          </aside>
        )}
        {content.diagram && (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
            <h3 className="border-b border-slate-800 px-4 py-3 text-xs font-medium tracking-wider text-slate-400 uppercase">
              Architecture flow
            </h3>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-emerald-200">
              <code dir="ltr">{content.diagram}</code>
            </pre>
          </div>
        )}
      </div>
    );
  }

  if (view === 'commands') {
    return (
      <div className="space-y-5">
        {content.code ? (
          <CodeExample code={content.code} label="AWS CLI" onCopy={copyCode} copied={copied} />
        ) : (
          <p className="rounded-xl border border-slate-800 p-4 leading-7 text-slate-400">
            This overview step has no setup commands.
          </p>
        )}
        {content.verify && (
          <CodeExample
            code={content.verify}
            label="Verify it worked"
            onCopy={copyCode}
            copied={copied}
          />
        )}
      </div>
    );
  }

  if (view === 'concepts') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {(content.concepts ?? []).map((concept) => (
          <article
            className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            key={concept.title}
          >
            <h3 className="font-semibold text-white">{concept.title}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-300">{concept.text}</p>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {(content.tradeoffs ?? []).map((tradeoff, index) => (
        <article
          className="grid gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:grid-cols-2"
          key={index}
        >
          <div>
            <p className="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
              Advantages
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{tradeoff.pro}</p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
              Trade-offs
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">{tradeoff.con}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function CodeExample({
  code,
  label,
  onCopy,
  copied,
}: {
  code: string;
  label: string;
  onCopy: (value: string) => void;
  copied: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
      <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <h3 className="text-xs font-medium tracking-wider text-slate-400 uppercase">{label}</h3>
        <button
          aria-label={copied ? 'Copied to clipboard' : `Copy ${label}`}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/5"
          onClick={() => onCopy(code)}
          type="button"
        >
          {copied ? <Check aria-hidden="true" size={13} /> : <Code2 aria-hidden="true" size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-cyan-100">
        <code dir="ltr">{code}</code>
      </pre>
    </div>
  );
}
