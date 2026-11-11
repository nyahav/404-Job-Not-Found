import { AlertTriangle, Check, HardDrive, RotateCcw, ScrollText } from 'lucide-react';
import { useCallback, useState } from 'react';
import LessonFrame from './LessonFrame';
import { usePlayback } from './usePlayback';

interface LogRecord {
  lsn: number;
  tx: string;
  operation: string;
  committed: boolean;
}

interface DirtyPage {
  key: string;
  value: string;
  tx: string;
  committed: boolean;
}

const initialRows = { account_a: '$100', account_b: '$100' };
const schedule = [
  'Begin transaction T1',
  'T1 updates account_a → $150',
  'Begin transaction T2',
  'T2 updates account_b → $50',
  'Commit T1',
];

export default function WALRecoverySimulator() {
  const [log, setLog] = useState<LogRecord[]>([]);
  const [dirtyPages, setDirtyPages] = useState<DirtyPage[]>([]);
  const [cursor, setCursor] = useState(0);
  const [recoveredRows, setRecoveredRows] = useState<Record<string, string> | null>(null);
  const [recoveryNote, setRecoveryNote] = useState('');
  const complete = cursor >= schedule.length;

  const step = useCallback(() => {
    if (cursor >= schedule.length) return;
    const nextLog = log.map((record) => ({ ...record }));
    let nextPages = [...dirtyPages];

    switch (cursor) {
      case 0:
        nextLog.push({ lsn: nextLog.length + 1, tx: 'T1', operation: 'BEGIN', committed: false });
        break;
      case 1:
        nextLog.push({
          lsn: nextLog.length + 1,
          tx: 'T1',
          operation: 'UPDATE account_a: $100 → $150',
          committed: false,
        });
        nextPages.push({ key: 'account_a', value: '$150', tx: 'T1', committed: false });
        break;
      case 2:
        nextLog.push({ lsn: nextLog.length + 1, tx: 'T2', operation: 'BEGIN', committed: false });
        break;
      case 3:
        nextLog.push({
          lsn: nextLog.length + 1,
          tx: 'T2',
          operation: 'UPDATE account_b: $100 → $50',
          committed: false,
        });
        nextPages.push({ key: 'account_b', value: '$50', tx: 'T2', committed: false });
        break;
      case 4:
        nextLog.push({
          lsn: nextLog.length + 1,
          tx: 'T1',
          operation: 'COMMIT · fsync WAL',
          committed: true,
        });
        nextLog.forEach((record) => {
          if (record.tx === 'T1') record.committed = true;
        });
        nextPages = nextPages.map((page) =>
          page.tx === 'T1' ? { ...page, committed: true } : page,
        );
        break;
      default:
        break;
    }

    setLog(nextLog);
    setDirtyPages(nextPages);
    setCursor((index) => index + 1);
    setRecoveredRows(null);
    setRecoveryNote('');
  }, [cursor, dirtyPages, log]);
  const { isPlaying, advance, stop, toggle } = usePlayback(step, complete);

  const recover = () => {
    stop();
    const rows: Record<string, string> = { ...initialRows };
    const committedTransactions = new Set(
      log.filter((record) => record.committed).map((record) => record.tx),
    );
    const replayed = log.filter(
      (record) => record.operation.startsWith('UPDATE') && committedTransactions.has(record.tx),
    );
    for (const record of replayed) {
      const match = /UPDATE (\w+): .+ → (.+)/.exec(record.operation);
      if (match?.[1] && match[2]) rows[match[1]] = match[2];
    }
    const undone = new Set(dirtyPages.filter((page) => !page.committed).map((page) => page.tx));
    setRecoveredRows(rows);
    setRecoveryNote(
      `REDO ${replayed.length} committed update${replayed.length === 1 ? '' : 's'} · UNDO ${undone.size} uncommitted transaction${undone.size === 1 ? '' : 's'}`,
    );
  };

  const reset = () => {
    stop();
    setLog([]);
    setDirtyPages([]);
    setCursor(0);
    setRecoveredRows(null);
    setRecoveryNote('');
  };

  return (
    <LessonFrame
      complete={complete}
      description="Commit records reach durable log storage before data pages. After a simulated power loss, recovery replays committed work and rolls back incomplete transactions."
      eyebrow="Durability · Write-ahead log"
      isPlaying={isPlaying}
      onReset={reset}
      onStep={advance}
      onToggle={toggle}
      title="WAL crash recovery"
      why="The write-ahead rule means a database can acknowledge a commit once its log is durable, even before data pages are flushed. Recovery makes that promise true after a crash by redoing committed changes and undoing incomplete ones."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-slate-500">
          SCHEDULE: {cursor}/{schedule.length} EVENTS
        </span>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200 transition hover:border-rose-300/60 disabled:opacity-40"
          disabled={!log.length || recoveredRows !== null}
          onClick={recover}
          type="button"
        >
          <AlertTriangle aria-hidden="true" size={15} />
          Simulate crash & recover
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4">
          <h3 className="flex items-center gap-2 font-mono text-xs text-cyan-300">
            <ScrollText size={15} /> WAL BUFFER → DISK LOG
          </h3>
          <div className="mt-3 max-h-56 space-y-2 overflow-auto">
            {log.length ? (
              log.map((record) => (
                <div className="flex items-start gap-2 font-mono text-[11px]" key={record.lsn}>
                  <span className="text-slate-600">#{String(record.lsn).padStart(2, '0')}</span>
                  <span className={record.committed ? 'text-emerald-300' : 'text-slate-400'}>
                    {record.tx}
                  </span>
                  <span className="min-w-0 break-words text-slate-300">{record.operation}</span>
                  {record.committed && (
                    <Check
                      aria-label="durable commit"
                      className="shrink-0 text-emerald-400"
                      size={13}
                    />
                  )}
                </div>
              ))
            ) : (
              <p className="font-mono text-xs text-slate-600">No log records yet.</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-amber-500/20 bg-slate-950/70 p-4">
          <h3 className="flex items-center gap-2 font-mono text-xs text-amber-300">
            <HardDrive size={15} /> DIRTY PAGES · BUFFER POOL
          </h3>
          <div className="mt-3 space-y-2">
            {dirtyPages.length ? (
              dirtyPages.map((page) => (
                <div
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 px-3 py-2 font-mono text-xs"
                  key={page.key}
                >
                  <span className="text-slate-300">
                    {page.key} = {page.value}
                  </span>
                  <span className={page.committed ? 'text-emerald-300' : 'text-amber-300'}>
                    {page.committed ? `${page.tx} COMMITTED` : `${page.tx} UNCOMMITTED`}
                  </span>
                </div>
              ))
            ) : (
              <p className="font-mono text-xs text-slate-600">No dirty pages yet.</p>
            )}
          </div>
        </section>
      </div>

      {recoveredRows && (
        <div
          aria-live="polite"
          className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.05] p-4"
        >
          <p className="flex items-center gap-2 font-mono text-xs text-emerald-300">
            <RotateCcw size={14} /> RECOVERED DATA FILES
          </p>
          <div className="mt-3 flex flex-wrap gap-3 font-mono text-sm text-white">
            {Object.entries(recoveredRows).map(([key, value]) => (
              <span key={key}>
                {key}: {value}
              </span>
            ))}
          </div>
          <p className="mt-2 font-mono text-[10px] text-slate-400">{recoveryNote}</p>
        </div>
      )}
    </LessonFrame>
  );
}
