import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, BookOpen, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: (skipForSession: boolean) => void;
}

const steps = [
  {
    title: 'A simulated production incident',
    body: 'You are responding to a checkout outage in a deterministic, client-side scenario; it does not connect to real services or change production systems.',
    detail: 'Start at the pager, then acknowledge it to begin the incident clock.',
  },
  {
    title: 'Investigate the signals',
    body: 'Use the timeline, service map, metrics, and toolbelt to uncover clues. Each lookup costs part of a limited investigation budget.',
    detail: 'Select a service on the map or a tool in the toolbelt to inspect relevant evidence.',
  },
  {
    title: 'Build a causal diagnosis',
    body: 'Connect the trigger, mechanism, and effect on the Evidence Wall. Support your explanation with the clues you found.',
    detail: 'A symptom is not always the root cause. Compare evidence across time and services.',
  },
  {
    title: 'Choose changes carefully',
    body: 'Select up to three production changes. Every choice has a cost, a rollout time, and possible side effects.',
    detail: 'You can consult the team, but the final change plan is yours to make.',
  },
  {
    title: 'Replay, learn, and review',
    body: 'Replay the same incident with your changes and compare it with no change and the ideal fix. Then review your post-mortem and score.',
    detail:
      'Use the phase bar to revisit phases you have already reached. Help bubbles explain tricky controls at any time.',
  },
];

const skipCookie = 'three-am-skip-tutorial';

function hasSkippedTutorial() {
  return document.cookie.split(';').some((cookie) => cookie.trim() === `${skipCookie}=1`);
}

export function saveTutorialPreference(skipForSession: boolean) {
  if (skipForSession) {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${skipCookie}=1; Path=/; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${skipCookie}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function shouldShowTutorial() {
  return !hasSkippedTutorial();
}

export default function TutorialDialog({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  const [skipForSession, setSkipForSession] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const currentStep = steps[step];

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(skipForSession);
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled)',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose, open, skipForSession]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-slate-950/85 p-4 backdrop-blur-sm"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose(skipForSession);
          }}
        >
          <motion.section
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-describedby="three-am-tutorial-description"
            aria-labelledby="three-am-tutorial-title"
            aria-modal="true"
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-cyan-400/20 bg-slate-900 shadow-2xl shadow-black/60"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            ref={dialogRef}
            role="dialog"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
              <div>
                <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-cyan-300">
                  <BookOpen aria-hidden="true" size={14} /> QUICK FIELD GUIDE
                </p>
                <h2 className="mt-2 text-xl font-bold text-white" id="three-am-tutorial-title">
                  How to use the 3 AM lab
                </h2>
              </div>
              <button
                aria-label="Close tutorial"
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-slate-700 text-slate-400 transition hover:border-slate-500 hover:text-white"
                onClick={() => onClose(skipForSession)}
                ref={closeButtonRef}
                type="button"
              >
                <X aria-hidden="true" size={16} />
              </button>
            </div>

            <div className="px-5 py-6 sm:px-6">
              <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                <span>
                  STEP {step + 1} OF {steps.length}
                </span>
                <span>INCIDENT RESPONSE</span>
              </div>
              <div
                aria-hidden="true"
                className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800"
              >
                <motion.div
                  animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                  className="h-full rounded-full bg-cyan-400"
                />
              </div>
              <div aria-live="polite" className="min-h-36 pt-6">
                <h3 className="text-lg font-semibold text-white">{currentStep.title}</h3>
                <p
                  className="mt-3 text-sm leading-6 text-slate-300"
                  id="three-am-tutorial-description"
                >
                  {currentStep.body}
                </p>
                <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs leading-5 text-cyan-100/80">
                  {currentStep.detail}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                <label className="flex cursor-pointer items-start gap-2 text-xs leading-5 text-slate-400">
                  <input
                    checked={skipForSession}
                    className="mt-1 accent-cyan-400"
                    onChange={(event) => {
                      const checked = event.target.checked;
                      setSkipForSession(checked);
                      if (checked) onClose(true);
                    }}
                    type="checkbox"
                  />
                  <span>Don’t need the tutorial — hide it for this browser session</span>
                </label>
                <div className="ml-auto flex items-center gap-2">
                  {step > 0 && (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
                      onClick={() => setStep((current) => current - 1)}
                      type="button"
                    >
                      <ArrowLeft aria-hidden="true" size={13} /> Back
                    </button>
                  )}
                  {step < steps.length - 1 ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-100 transition hover:border-cyan-300/50"
                      onClick={() => setStep((current) => current + 1)}
                      type="button"
                    >
                      Next <ArrowRight aria-hidden="true" size={13} />
                    </button>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 transition hover:border-emerald-300/50"
                      onClick={() => onClose(skipForSession)}
                      type="button"
                    >
                      <Check aria-hidden="true" size={13} /> Start incident
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
