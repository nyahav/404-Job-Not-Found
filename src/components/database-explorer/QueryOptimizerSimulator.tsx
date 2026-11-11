import { Database, Search, Table2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import LessonFrame from './LessonFrame';
import { usePlayback } from './usePlayback';

const rowOptions = [10_000, 100_000, 1_000_000];

export default function QueryOptimizerSimulator() {
  const [hasIndex, setHasIndex] = useState(true);
  const [rowCount, setRowCount] = useState(100_000);
  const [email, setEmail] = useState('ada@example.com');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionCount, setExecutionCount] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const costs = useMemo(() => {
    const tablePages = Math.ceil(rowCount / 100);
    const indexPages = Math.ceil(Math.log2(rowCount)) + 2;
    return {
      tablePages,
      indexPages,
      selectedCost: hasIndex ? indexPages : tablePages,
      complexity: hasIndex ? 'O(log N)' : 'O(N)',
    };
  }, [hasIndex, rowCount]);

  const step = useCallback(() => {
    if (isExecuting) return;
    setIsExecuting(true);
    timeoutRef.current = window.setTimeout(() => {
      setIsExecuting(false);
      setExecutionCount((count) => count + 1);
    }, 650);
  }, [isExecuting]);
  const { isPlaying, advance, stop, toggle } = usePlayback(step, false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const reset = () => {
    stop();
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    setIsExecuting(false);
    setExecutionCount(0);
  };

  return (
    <LessonFrame
      complete={false}
      description="Edit the lookup, table size, or index availability. Execute to compare the optimizer's estimated I/O path."
      eyebrow="Query planning · Cost model"
      isPlaying={isPlaying}
      onReset={reset}
      onStep={advance}
      onToggle={toggle}
      title="Index scan vs. table scan"
      why="An index changes lookup work from touching most table pages to following a compact search structure and fetching matching rows. The planner compares estimated CPU and I/O cost; selective predicates and accurate statistics determine whether the index is worthwhile."
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
            <span className="font-mono text-[10px] text-slate-500">SQL EDITOR · READ ONLY</span>
            <span className="font-mono text-[10px] text-emerald-400">SELECT</span>
          </div>
          <pre className="overflow-x-auto px-4 py-4 font-mono text-xs leading-6 text-slate-300">
            <span className="text-violet-300">SELECT</span> *{'\n'}
            <span className="text-violet-300">FROM</span> users{'\n'}
            <span className="text-violet-300">WHERE</span> email ={' '}
            <span className="text-amber-200">'{email || '...'}'</span>;
          </pre>
          <div className="grid gap-3 border-t border-slate-800 p-3 sm:grid-cols-2">
            <label className="font-mono text-[10px] text-slate-500">
              EMAIL VALUE
              <input
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                maxLength={48}
                onChange={(event) => setEmail(event.target.value.replace(/[';]/g, ''))}
                value={email}
              />
            </label>
            <label className="font-mono text-[10px] text-slate-500">
              TABLE ROWS
              <select
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-2 text-xs text-white outline-none focus:border-cyan-500/50"
                onChange={(event) => setRowCount(Number(event.target.value))}
                value={rowCount}
              >
                {rowOptions.map((rows) => (
                  <option key={rows} value={rows}>
                    {rows.toLocaleString()}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database aria-hidden="true" className="text-cyan-300" size={17} />
              <span className="font-mono text-xs text-slate-300">INDEX · users(email)</span>
            </div>
            <button
              aria-checked={hasIndex}
              className={`relative h-6 w-11 rounded-full transition ${hasIndex ? 'bg-emerald-500/70' : 'bg-slate-700'}`}
              onClick={() => setHasIndex((enabled) => !enabled)}
              role="switch"
              type="button"
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-white transition-all ${hasIndex ? 'left-6' : 'left-1'}`}
              />
            </button>
          </div>
          <div className="mt-5 space-y-3">
            <PlanNode
              label={hasIndex ? 'B-Tree Index Scan' : 'Sequential Scan'}
              sublabel={hasIndex ? 'seek → matching row' : 'inspect every page'}
              color={hasIndex ? 'emerald' : 'rose'}
              active
              icon={hasIndex ? <Search size={16} /> : <Table2 size={16} />}
            />
            <div
              className={`rounded-lg border p-3 ${hasIndex ? 'border-emerald-500/25 bg-emerald-500/[0.04]' : 'border-rose-500/25 bg-rose-500/[0.04]'}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px]">
                <span className={hasIndex ? 'text-emerald-300' : 'text-rose-300'}>
                  EST. {costs.selectedCost.toLocaleString()} PAGE I/Os
                </span>
                <span className="text-slate-400">CPU {hasIndex ? 'LOW' : 'HIGH'}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hasIndex ? 'bg-emerald-400' : 'bg-rose-400'}`}
                  style={{
                    width: `${Math.min(100, (costs.selectedCost / costs.tablePages) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 font-mono text-xs text-white">
                {costs.complexity} · {costs.selectedCost.toLocaleString()} estimated pages
              </p>
            </div>
            <button
              className="w-full rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-400/50 disabled:opacity-50"
              disabled={isExecuting}
              onClick={advance}
              type="button"
            >
              {isExecuting ? 'Executing query…' : 'Execute query'}
            </button>
          </div>
        </section>
      </div>
      <p aria-live="polite" className="mt-4 font-mono text-[10px] text-slate-500">
        {executionCount
          ? `Last execution complete · ${costs.selectedCost.toLocaleString()} estimated page reads · ${hasIndex ? 'index path' : 'full scan path'}`
          : 'Cost estimates are illustrative; real optimizers use table statistics, selectivity, and hardware costs.'}
      </p>
    </LessonFrame>
  );
}

function PlanNode({
  label,
  sublabel,
  color,
  active,
  icon,
}: {
  label: string;
  sublabel: string;
  color: 'emerald' | 'rose';
  active: boolean;
  icon: ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 ${color === 'emerald' ? 'border-emerald-500/25 text-emerald-300' : 'border-rose-500/25 text-rose-300'} ${active ? 'animate-[pulse_1s_ease-in-out_1]' : ''}`}
    >
      {icon}
      <div>
        <p className="font-mono text-xs">{label}</p>
        <p className="mt-1 font-mono text-[10px] text-slate-500">{sublabel}</p>
      </div>
    </div>
  );
}
