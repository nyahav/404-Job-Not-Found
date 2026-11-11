import { Link2, Plus, Search, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import { validateClaim } from './engine';
import HelpTip from './HelpTip';
import { scenario } from './scenario';
import { CLAIM_SLOT_LABELS } from './types';
import type { Claim, ClaimSlot, Clue, IncidentPhase } from './types';

interface Props {
  phase: IncidentPhase;
  clues: Clue[];
  claim: Claim;
  evidenceIds: string[];
  diagnosisSubmitted: boolean;
  onClaimChange: (slot: ClaimSlot, value: string) => void;
  onEvidenceToggle: (clueId: string) => void;
  onContinue: () => void;
  onCheckDiagnosis: () => void;
}

export default function EvidenceWall({
  phase,
  clues,
  claim,
  evidenceIds,
  diagnosisSubmitted,
  onClaimChange,
  onEvidenceToggle,
  onContinue,
  onCheckDiagnosis,
}: Props) {
  const canEditClaim = phase === 'diagnose' || phase === 'investigate';
  const diagnosis = validateClaim(claim, evidenceIds);
  const submittedReady = diagnosisSubmitted;
  const slotKeys: ClaimSlot[] = ['trigger', 'mechanism', 'effect'];

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const clueId = event.dataTransfer.getData('text/clue-id');
    if (clueId && clues.some((clue) => clue.id === clueId)) onEvidenceToggle(clueId);
  };

  return (
    <section
      aria-label="Evidence wall"
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-1">
          <h2 className="font-mono text-xs font-semibold tracking-wider text-slate-200">
            EVIDENCE WALL
          </h2>
          <HelpTip label="About building a diagnosis">
            Connect a trigger, a mechanism, and an effect, then attach clues that support your
            causal explanation. You can drag clues or use their add buttons.
          </HelpTip>
        </div>
        <span className="font-mono text-[10px] text-slate-500">{clues.length} CLUES</span>
      </header>

      <div className="p-4">
        <p className="text-xs leading-5 text-slate-500">
          Drag a clue onto the chain or select it with the button. Connect a trigger to a mechanism
          and its effect.
        </p>

        <div
          className="mt-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <div className="space-y-3">
            {slotKeys.map((slot, index) => (
              <div className="relative" key={slot}>
                {index > 0 && (
                  <div
                    aria-hidden="true"
                    className="absolute -top-3 left-4 h-3 border-l border-dashed border-amber-400/40"
                  />
                )}
                <label
                  className="block font-mono text-[9px] tracking-wider text-slate-500"
                  htmlFor={`claim-${slot}`}
                >
                  {CLAIM_SLOT_LABELS[slot].toUpperCase()}
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2.5 text-xs leading-5 text-slate-200 transition outline-none focus:border-cyan-400/50 disabled:opacity-70"
                  disabled={!canEditClaim || submittedReady}
                  id={`claim-${slot}`}
                  onChange={(event) => onClaimChange(slot, event.target.value)}
                  value={claim[slot]}
                >
                  <option value="">Connect a causal claim…</option>
                  {scenario.claimSlots[slot].map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-4 border-t border-slate-800 pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-wider text-slate-500">
                <Link2 aria-hidden="true" size={12} /> SUPPORTING EVIDENCE
              </span>
              {evidenceIds.length > 0 && (
                <button
                  className="inline-flex items-center gap-1 font-mono text-[9px] text-slate-600 transition hover:text-slate-300"
                  disabled={!canEditClaim || submittedReady}
                  onClick={() => evidenceIds.forEach(onEvidenceToggle)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={11} /> clear
                </button>
              )}
            </div>
            <div className="mt-2 flex min-h-9 flex-wrap gap-1.5">
              {evidenceIds.length ? (
                evidenceIds.map((id) => {
                  const clue = clues.find((item) => item.id === id);
                  return clue ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-cyan-500/[0.07] px-2 py-1 font-mono text-[9px] text-cyan-200"
                      disabled={!canEditClaim || submittedReady}
                      key={id}
                      onClick={() => onEvidenceToggle(id)}
                      type="button"
                    >
                      {clue.title} <span aria-hidden="true">×</span>
                    </button>
                  ) : null;
                })
              ) : (
                <span className="self-center font-mono text-[9px] text-slate-700">
                  Drop clue cards here
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {clues.length ? (
            clues.map((clue) => {
              const selected = evidenceIds.includes(clue.id);
              return (
                <article
                  className={`rounded-lg border p-3 transition ${
                    selected
                      ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                      : 'border-slate-800 bg-slate-950/50'
                  }`}
                  draggable={canEditClaim && !submittedReady}
                  key={clue.id}
                  onDragStart={(event) => event.dataTransfer.setData('text/clue-id', clue.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-slate-300">{clue.title}</p>
                      <p className="mt-1.5 text-xs leading-5 text-slate-500">{clue.reveals}</p>
                    </div>
                    <button
                      aria-label={`${selected ? 'Remove' : 'Add'} ${clue.title} ${selected ? 'from' : 'to'} supporting evidence`}
                      aria-pressed={selected}
                      className={`grid size-7 shrink-0 place-items-center rounded-lg border transition ${
                        selected
                          ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200'
                          : 'border-slate-700 text-slate-500 hover:border-cyan-400/40 hover:text-cyan-200'
                      }`}
                      disabled={!canEditClaim || submittedReady}
                      onClick={() => onEvidenceToggle(clue.id)}
                      type="button"
                    >
                      {selected ? (
                        <span aria-hidden="true">✓</span>
                      ) : (
                        <Plus aria-hidden="true" size={13} />
                      )}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center">
              <Search aria-hidden="true" className="mx-auto text-slate-700" size={17} />
              <p className="mt-2 text-xs text-slate-600">
                Investigate a service to collect clue cards.
              </p>
            </div>
          )}
        </div>

        {phase === 'investigate' && (
          <button
            className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
            onClick={onContinue}
            type="button"
          >
            Build a causal claim
          </button>
        )}
        {phase === 'diagnose' && !submittedReady && (
          <button
            className="mt-4 w-full rounded-lg border border-amber-400/30 bg-amber-400/[0.06] px-3 py-2.5 text-sm text-amber-200 transition hover:border-amber-300/50"
            onClick={onCheckDiagnosis}
            type="button"
          >
            Lock in diagnosis · continue to fixes
          </button>
        )}
        {phase === 'diagnose' && submittedReady && (
          <p
            aria-live="polite"
            className="mt-4 flex items-center gap-2 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-[10px] text-slate-500"
          >
            <Search aria-hidden="true" size={12} />
            Claim recorded. The post-mortem will reveal how it matches the incident.
          </p>
        )}
        {phase === 'investigate' && diagnosis !== 'wrong' && clues.length > 0 && (
          <p className="sr-only">Evidence connected to a draft causal claim.</p>
        )}
      </div>
    </section>
  );
}
