import {
  Activity,
  Boxes,
  Braces,
  GitCommitHorizontal,
  Network,
  ScrollText,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { getAvailableClues } from './engine';
import { scenario } from './scenario';
import { TOOL_LABELS } from './types';
import type { Clue, ToolId } from './types';

const tools: { id: ToolId; icon: typeof Activity; note: string }[] = [
  { id: 'metrics', icon: Activity, note: 'CPU, cache hit rate, latency' },
  { id: 'logs', icon: ScrollText, note: 'Service and application logs' },
  { id: 'traces', icon: Network, note: 'Request paths and fan-out' },
  { id: 'slow-query', icon: Search, note: 'Database slow-query samples' },
  { id: 'deploys', icon: GitCommitHorizontal, note: 'Deploy and job history' },
  { id: 'config', icon: Braces, note: 'Runtime configuration' },
  { id: 'topology', icon: Boxes, note: 'Service dependencies' },
];

interface Props {
  scrubMinute: number;
  discoveredClues: Clue[];
  lookupsUsed: number;
  lookupLimit: number;
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  onLookup: (clue: Clue) => void;
}

export default function Toolbelt({
  scrubMinute,
  discoveredClues,
  lookupsUsed,
  lookupLimit,
  activeTool,
  onToolChange,
  onLookup,
}: Props) {
  const discoveredIds = discoveredClues.map((clue) => clue.id);
  const available = getAvailableClues(scenario.clues, discoveredIds, scrubMinute, activeTool);
  const active = tools.find((tool) => tool.id === activeTool) ?? tools[0];
  const Icon = active.icon;
  const foundForTool = discoveredClues.filter((clue) => clue.tool === activeTool);
  const pendingForTool = scenario.clues.filter(
    (clue) => clue.tool === activeTool && !discoveredIds.includes(clue.id),
  );
  const lockedByEvidence = pendingForTool.some((clue) =>
    clue.requires?.some((requiredId) => !discoveredIds.includes(requiredId)),
  );
  const lockedByTime = pendingForTool.some(
    (clue) =>
      (clue.earliestMinute !== undefined && scrubMinute < clue.earliestMinute) ||
      (clue.latestMinute !== undefined && scrubMinute > clue.latestMinute),
  );

  return (
    <section
      aria-label="Investigation toolbelt"
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
        <h2 className="font-mono text-xs font-semibold tracking-wider text-slate-200">TOOLBELT</h2>
        <span
          className={`font-mono text-[10px] ${lookupsUsed >= lookupLimit ? 'text-rose-300' : 'text-slate-500'}`}
        >
          LOOKUPS {lookupsUsed}/{lookupLimit}
        </span>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-800 px-2 py-2">
        {tools.map((tool) => {
          const ToolIcon = tool.icon;
          return (
            <button
              aria-pressed={tool.id === activeTool}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs transition ${
                tool.id === activeTool
                  ? 'bg-cyan-500/10 text-cyan-200'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              type="button"
            >
              <ToolIcon aria-hidden="true" size={14} />
              {TOOL_LABELS[tool.id]}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 p-4 md:grid-cols-[minmax(150px,0.65fr)_minmax(0,1.35fr)]">
        <div>
          <div className="flex items-center gap-2 text-cyan-300">
            <Icon aria-hidden="true" size={16} />
            <h3 className="text-sm font-semibold text-slate-200">{TOOL_LABELS[activeTool]}</h3>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">{active.note}</p>
        </div>

        <div className="space-y-2">
          {foundForTool.map((clue) => (
            <article
              className="rounded-lg border border-slate-700/80 bg-slate-950/70 p-3"
              key={clue.id}
            >
              <p className="font-mono text-[10px] text-cyan-300">{clue.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">{clue.reveals}</p>
            </article>
          ))}
          {available.map((clue) => (
            <button
              className="group flex w-full items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/50 p-3 text-left transition hover:border-cyan-400/40 hover:bg-cyan-500/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
              disabled={lookupsUsed >= lookupLimit}
              key={clue.id}
              onClick={() => onLookup(clue)}
              type="button"
            >
              <span>
                <span className="block font-mono text-[10px] text-slate-400">{clue.title}</span>
                <span className="mt-1 block text-xs text-slate-600">Inspect · costs 1 lookup</span>
              </span>
              <Search
                aria-hidden="true"
                className="shrink-0 text-slate-600 transition group-hover:text-cyan-300"
                size={15}
              />
            </button>
          ))}
          {!foundForTool.length && !available.length && (
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                <ShieldAlert aria-hidden="true" size={13} />
                {lockedByEvidence
                  ? 'CLUE LOCKED · investigate cache hit rate first'
                  : lockedByTime
                    ? 'NO SIGNALS AT THIS TIME · scrub the timeline'
                    : lookupsUsed >= lookupLimit
                      ? 'LOOKUP BUDGET SPENT'
                      : 'NO NEW EVIDENCE HERE'}
              </p>
              {activeTool === 'config' && (
                <p className="mt-2 text-xs leading-5 text-slate-600">
                  The TTL configuration becomes available after inspecting the cache hit-rate drop,
                  while the scrubber is near the 11:00 bulk load.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
