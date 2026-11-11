import { Award, BookOpenCheck, Check, Copy, Share2, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { calculateScores } from './engine';
import { actionPalette, scenario } from './scenario';
import {
  CLAIM_SLOT_LABELS,
  type ActionResolution,
  type Claim,
  type Clue,
  type DiagnosisGrade,
  type OutcomeKind,
} from './types';

interface Props {
  resolution: ActionResolution;
  outcome: OutcomeKind;
  diagnosis: DiagnosisGrade;
  claim: Claim;
  selectedEvidenceIds: string[];
  discoveredClues: Clue[];
  elapsedSeconds: number;
  lookupsUsed: number;
  ignoredSenior: boolean;
  hintsUsed: number;
  codexUnlocked: boolean;
  onBackToReplay: () => void;
  onUnlockCodex: () => void;
}

export default function PostMortem({
  resolution,
  outcome,
  diagnosis,
  claim,
  selectedEvidenceIds,
  discoveredClues,
  elapsedSeconds,
  lookupsUsed,
  ignoredSenior,
  hintsUsed,
  codexUnlocked,
  onBackToReplay,
  onUnlockCodex,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const selectedEvidence = discoveredClues.filter((clue) => selectedEvidenceIds.includes(clue.id));
  const scores = calculateScores({
    elapsedMinutes: elapsedSeconds / 60,
    costUsd: resolution.totalCostUsd,
    lookupsUsed,
    lookupBudget: scenario.budget.lookups,
    selectedEvidenceIds,
    diagnosis,
    outcome,
    sideEffects: resolution.sideEffects,
    hintsUsed,
  });
  const headline =
    outcome === 'fixed'
      ? 'ALL CLEAR'
      : outcome === 'stabilised'
        ? 'STABILISED'
        : outcome === 'worse'
          ? 'MADE IT WORSE'
          : 'NO EFFECT';
  const headlineColor =
    outcome === 'fixed'
      ? 'text-emerald-300 border-emerald-400/40 bg-emerald-400/[0.07]'
      : outcome === 'stabilised'
        ? 'text-amber-300 border-amber-400/40 bg-amber-400/[0.07]'
        : 'text-rose-300 border-rose-400/40 bg-rose-400/[0.07]';
  const shareGrid = `${scores.grade} · ${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}m · $${resolution.totalCostUsd} · ${scores.blastRadius} blast radius`;

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(
        `3 AM · ${scenario.title}\n${shareGrid}\nSpoiler-free incident response`,
      );
      setCopied(true);
      setCopyError('');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(
        'Clipboard access is unavailable. You can copy the result manually: ' + shareGrid,
      );
    }
  };

  const diagnosisLabel = {
    exact: 'Exact diagnosis',
    partial: 'Partially correct',
    symptom_only: 'Symptom mistaken for cause',
    wrong: 'Incorrect causal claim',
  }[diagnosis];

  return (
    <section aria-labelledby="postmortem-title" className="space-y-5">
      <header
        className={`relative overflow-hidden rounded-2xl border p-5 text-center sm:p-8 ${headlineColor}`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(52,211,153,0.08),transparent_60%)]"
        />
        <div className="relative">
          <p className="font-mono text-[10px] tracking-[0.25em] opacity-70">
            INCIDENT #{scenario.seed}
          </p>
          <h2
            className="mt-2 text-3xl font-black tracking-[0.12em] sm:text-5xl"
            id="postmortem-title"
          >
            {headline}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {scenario.title} · recovery time {formatClock(elapsedSeconds)}
          </p>
          {outcome === 'stabilised' && (
            <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-amber-100/80">
              Customer impact is lower, but the synchronized cache-expiry trigger is still live.
            </p>
          )}
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-cyan-300 uppercase">
              Incident post-mortem
            </p>
            <h3 className="mt-1 text-xl font-bold text-white">{scenario.title}</h3>
          </div>
          {copyError && (
            <p aria-live="polite" className="text-right text-xs text-amber-200">
              {copyError}
            </p>
          )}
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2">
            <Award aria-hidden="true" className="text-amber-300" size={20} />
            <span className="font-mono text-2xl font-bold text-white">{scores.grade}</span>
            <span className="font-mono text-[10px] text-slate-500">{scores.total}/100</span>
          </div>
        </div>
        <p className="mt-4 leading-7 text-slate-300">{scenario.summary}</p>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <ScoreRow label="Time to recovery" value={scores.recovery} />
          <ScoreRow label="Blast radius" value={scores.blastRadius} />
          <ScoreRow label="Cost efficiency" value={scores.cost} />
          <ScoreRow label="Investigation" value={scores.investigation} />
          <ScoreRow label="Diagnosis · 15%" value={scores.diagnosis} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h3 className="font-semibold text-white">Your causal claim</h3>
          <div className="mt-3 space-y-2">
            {(['trigger', 'mechanism', 'effect'] as const).map((slot) => {
              const label =
                scenario.claimSlots[slot].find((option) => option.id === claim[slot])?.label ??
                'Not selected';
              return (
                <p className="flex gap-2 text-sm text-slate-300" key={slot}>
                  <span className="w-20 shrink-0 font-mono text-[10px] text-slate-500">
                    {CLAIM_SLOT_LABELS[slot]}
                  </span>
                  {label}
                </p>
              );
            })}
          </div>
          <p
            className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[10px] ${diagnosis === 'exact' ? 'border-emerald-400/30 text-emerald-300' : 'border-amber-400/30 text-amber-200'}`}
          >
            {diagnosis === 'exact' ? <Check size={12} /> : <ShieldAlert size={12} />}
            {diagnosisLabel}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-400">{scenario.whySymptomsMisled}</p>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h3 className="font-semibold text-white">Change review</h3>
          <div className="mt-3 space-y-3">
            {resolution.actions.map((resolved) => (
              <article className="border-l-2 border-slate-700 pl-3" key={resolved.action.id}>
                <p className="text-sm font-medium text-slate-200">{resolved.action.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{resolved.explain}</p>
                <p className="mt-1 font-mono text-[9px] text-slate-600">
                  {resolved.effect.toUpperCase()} · {resolved.action.timeMin} MIN · $
                  {resolved.action.costUsd}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-400">
            <strong className="font-medium text-cyan-200">Ideal fix: </strong>
            {scenario.idealFix
              .map((id) => actionPalette.find((action) => action.id === id)?.label)
              .join(' + ')}
            . &nbsp;
            {diagnosis !== 'exact' &&
              'A lucky fix without a supported diagnosis cannot score above B.'}
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] tracking-wider text-slate-500 uppercase">
              Signal / symptom / noise
            </p>
            <h3 className="mt-1 font-semibold text-white">Evidence, in hindsight</h3>
          </div>
          <span className="font-mono text-[10px] text-slate-600">
            {selectedEvidence.length} clue cards used
          </span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {discoveredClues.map((clue) => {
            const selected = selectedEvidenceIds.includes(clue.id);
            const kindLabel = clue.kind === 'red_herring' ? 'RED HERRING' : clue.kind.toUpperCase();
            const kindColor =
              clue.kind === 'signal'
                ? 'text-emerald-300'
                : clue.kind === 'symptom'
                  ? 'text-amber-300'
                  : 'text-rose-300';
            return (
              <article
                className={`rounded-lg border p-3 ${selected ? 'border-cyan-500/25 bg-cyan-500/[0.025]' : 'border-slate-800 bg-slate-950/40'}`}
                key={clue.id}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[10px] text-slate-300">{clue.title}</p>
                  <span className={`font-mono text-[8px] ${kindColor}`}>
                    {kindLabel}
                    {selected ? ' · IN CLAIM' : ''}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">{clue.reveals}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/[0.035] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <BookOpenCheck aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-300" size={20} />
            <div>
              <p className="font-mono text-[10px] tracking-wider text-cyan-300">
                INCIDENT CODEX · PATTERN UNLOCK
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">{scenario.rootConcept}</h3>
            </div>
          </div>
          {codexUnlocked ? (
            <span className="font-mono text-[9px] text-emerald-300">SAVED TO CODEX</span>
          ) : (
            <button
              className="rounded-lg border border-cyan-400/30 px-3 py-2 font-mono text-[10px] text-cyan-200 transition hover:bg-cyan-400/10"
              onClick={onUnlockCodex}
              type="button"
            >
              Save pattern
            </button>
          )}
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{scenario.conceptSummary}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-3">
          {scenario.conceptSignature.map((signature) => (
            <li className="flex gap-2 text-xs leading-5 text-slate-400" key={signature}>
              <Check aria-hidden="true" className="mt-0.5 shrink-0 text-cyan-400" size={12} />{' '}
              {signature}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-slate-600">
          {ignoredSenior
            ? 'BADGE PROGRESS · questioned the loud senior'
            : 'Next time: verify the signal before scaling.'}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-slate-500 hover:text-white"
            onClick={onBackToReplay}
            type="button"
          >
            View replay
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 transition hover:border-cyan-400/50"
            onClick={copyResult}
            type="button"
          >
            {copied ? (
              <Check aria-hidden="true" size={13} />
            ) : (
              <Share2 aria-hidden="true" size={13} />
            )}
            {copied ? 'Copied' : 'Share result'}
            {!copied && <Copy aria-hidden="true" size={12} />}
          </button>
        </div>
      </div>
    </section>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-2">
      <span className="min-w-32 text-xs text-slate-400">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <span
          className="block h-full rounded-full bg-cyan-400 transition-all"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="w-8 text-right font-mono text-[10px] text-slate-300">{value}</span>
    </div>
  );
}

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
