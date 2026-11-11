import { ArrowRight, Check, Clock3, DollarSign, Ticket, Wrench } from 'lucide-react';
import HelpTip from './HelpTip';
import { actionPalette } from './scenario';
import type { IncidentPhase } from './types';

interface Props {
  phase: IncidentPhase;
  selectedIds: string[];
  tickets: number;
  costUsd: number;
  maxTickets: number;
  maxCostUsd: number;
  suggestedActionIds: string[];
  onToggleAction: (actionId: string) => void;
  onReplay: () => void;
}

export default function ActionPalette({
  phase,
  selectedIds,
  tickets,
  costUsd,
  maxTickets,
  maxCostUsd,
  suggestedActionIds,
  onToggleAction,
  onReplay,
}: Props) {
  const canEdit = phase === 'fix';
  return (
    <section
      aria-label="Change action palette"
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-1 font-mono text-xs font-semibold tracking-wider text-slate-200">
            <Wrench aria-hidden="true" className="text-amber-300" size={15} /> CHANGE PALETTE
            <HelpTip label="About the change palette">
              Choose changes based on your diagnosis. Ticket count, cost, rollout time, and
              second-order effects all influence the outcome when you replay the incident.
            </HelpTip>
          </h2>
          <p className="mt-1 text-[10px] text-slate-600">
            Pick up to three changes. Side effects are part of the system.
          </p>
        </div>
        <div className="flex gap-3 font-mono text-[9px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Ticket size={11} /> {tickets}/{maxTickets}
          </span>
          <span className="inline-flex items-center gap-1">
            <DollarSign size={11} /> ${costUsd}/${maxCostUsd}
          </span>
        </div>
      </header>

      <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {actionPalette.map((action) => {
          const selected = selectedIds.includes(action.id);
          const suggested = suggestedActionIds.includes(action.id);
          const disabled =
            !canEdit ||
            (!selected && (tickets >= maxTickets || costUsd + action.costUsd > maxCostUsd));
          return (
            <button
              aria-pressed={selected}
              className={`group rounded-xl border p-3 text-left transition-all ${
                selected
                  ? 'border-cyan-400/45 bg-cyan-500/[0.08]'
                  : suggested
                    ? 'border-amber-400/25 bg-amber-400/[0.035] hover:border-amber-300/50'
                    : 'border-slate-800 bg-slate-950/50 hover:border-cyan-400/30 hover:bg-cyan-500/[0.025]'
              } disabled:cursor-not-allowed disabled:opacity-45`}
              disabled={disabled}
              key={action.id}
              onClick={() => onToggleAction(action.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-semibold text-slate-200">{action.label}</span>
                {selected ? (
                  <Check aria-hidden="true" className="shrink-0 text-cyan-300" size={14} />
                ) : suggested ? (
                  <span className="shrink-0 font-mono text-[8px] text-amber-300">TEAM TIP</span>
                ) : null}
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-500">{action.description}</p>
              <div className="mt-2 flex flex-wrap gap-2 font-mono text-[9px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Clock3 size={10} /> {action.timeMin}m
                </span>
                <span className="inline-flex items-center gap-1">
                  <DollarSign size={10} /> {action.costUsd}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {phase === 'diagnose' && (
        <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          Lock your causal diagnosis before making production changes.
        </div>
      )}
      {phase === 'investigate' && (
        <div className="border-t border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
          Investigate first. You can apply up to three changes after recording your diagnosis.
        </div>
      )}
      {phase === 'fix' && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
          <p aria-live="polite" className="font-mono text-[10px] text-slate-500">
            {tickets} TICKETS USED · {selectedIds.length} CHANGE
            {selectedIds.length === 1 ? '' : 'S'} SELECTED
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/35 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/55 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedIds.length === 0}
            onClick={onReplay}
            type="button"
          >
            Apply & replay <ArrowRight aria-hidden="true" size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
