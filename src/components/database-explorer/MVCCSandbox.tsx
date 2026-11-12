import { AlertOctagon, Eye, Layers3, ShieldCheck } from 'lucide-react';
import { useCallback, useState } from 'react';
import LessonFrame from './LessonFrame';
import { usePlayback } from './usePlayback';

type Isolation = 'Read Uncommitted' | 'Read Committed' | 'Repeatable Read' | 'Serializable';

const schedule = [
  'T1 writes balance = $120 (uncommitted)',
  'T2 reads balance',
  'T1 commits the new balance',
  'T2 reads balance again',
  'T1 inserts a matching row',
  'T2 repeats its range query',
  'T1 and T2 form a lock cycle',
];

function isIsolation(value: string): value is Isolation {
  return (
    value === 'Read Uncommitted' ||
    value === 'Read Committed' ||
    value === 'Repeatable Read' ||
    value === 'Serializable'
  );
}

export default function MVCCSandbox() {
  const [isolation, setIsolation] = useState<Isolation>('Read Committed');
  const [cursor, setCursor] = useState(0);
  const [balanceCommitted, setBalanceCommitted] = useState(false);
  const [phantomInserted, setPhantomInserted] = useState(false);
  const [aborted, setAborted] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const [latestRead, setLatestRead] = useState('$100');
  const complete = cursor >= schedule.length;

  const step = useCallback(() => {
    if (cursor >= schedule.length) return;
    switch (cursor) {
      case 0:
        setEvents((items) => [
          ...items,
          'T1: pending version $120 created; committed version remains $100.',
        ]);
        break;
      case 1:
        if (isolation === 'Read Uncommitted') {
          setLatestRead('$120');
          setEvents((items) => [
            ...items,
            'T2 reads uncommitted $120 - dirty read; value could disappear if T1 rolls back.',
          ]);
        } else {
          setLatestRead('$100');
          setEvents((items) => [
            ...items,
            `T2 reads $100 (${isolation === 'Read Committed' ? 'uncommitted version hidden' : 'snapshot sees committed version'}).`,
          ]);
        }
        break;
      case 2:
        setBalanceCommitted(true);
        setEvents((items) => [
          ...items,
          'T1 commits. Version $120 becomes visible to new snapshots.',
        ]);
        break;
      case 3: {
        const value =
          isolation === 'Read Committed' || isolation === 'Read Uncommitted' ? '$120' : '$100';
        const note =
          isolation === 'Read Committed'
            ? '— non-repeatable read.'
            : isolation === 'Read Uncommitted'
              ? '— the value is now committed.'
              : '— original snapshot is stable.';
        setLatestRead(value);
        setEvents((items) => [...items, `T2 reads ${value} ${note}`]);
        break;
      }
      case 4:
        setPhantomInserted(true);
        setEvents((items) => [...items, 'T1 inserts a new row matching the range predicate.']);
        break;
      case 5: {
        const foundPhantom = isolation !== 'Serializable';
        setEvents((items) => [
          ...items,
          `T2 repeats range query: ${foundPhantom ? 'new matching row appears (phantom).' : 'predicate lock hides the phantom until serial order allows it.'}`,
        ]);
        break;
      }
      case 6:
        setAborted(true);
        setEvents((items) => [
          ...items,
          'Deadlock detected: younger T2 is aborted and its locks are released.',
        ]);
        break;
      default:
        break;
    }
    setCursor((index) => index + 1);
  }, [cursor, isolation]);
  const { isPlaying, advance, stop, toggle } = usePlayback(step, complete);

  const reset = () => {
    stop();
    setCursor(0);
    setBalanceCommitted(false);
    setPhantomInserted(false);
    setAborted(false);
    setEvents([]);
    setLatestRead('$100');
  };

  const transactionText = {
    'Read Uncommitted':
      'Can expose uncommitted writes; a rollback may invalidate a value already read.',
    'Read Committed': 'Each statement sees committed data at statement start.',
    'Repeatable Read': 'Reads use a stable transaction snapshot in this model.',
    Serializable: 'Predicate locking prevents phantoms; conflicting work may wait.',
  }[isolation];

  return (
    <LessonFrame
      complete={complete}
      description="Advance two overlapping transactions and compare which row versions and range results each isolation level can observe."
      eyebrow="Concurrency · MVCC"
      isPlaying={isPlaying}
      onReset={reset}
      onStep={advance}
      onToggle={toggle}
      title="MVCC isolation sandbox"
      why="MVCC lets readers see a consistent version without blocking every writer. Isolation level determines which anomalies are possible; stronger guarantees can require predicate locks, retries, or aborts that affect throughput."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label
          className="flex items-center gap-2 font-mono text-xs text-slate-400"
          htmlFor="mvcc-isolation"
        >
          ISOLATION
          <select
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-cyan-200 outline-none focus:border-cyan-500/50"
            id="mvcc-isolation"
            onChange={(event) => {
              if (isIsolation(event.target.value)) {
                setIsolation(event.target.value);
                reset();
              }
            }}
            value={isolation}
          >
            <option>Read Uncommitted</option>
            <option>Read Committed</option>
            <option>Repeatable Read</option>
            <option>Serializable</option>
          </select>
        </label>
        <span className="font-mono text-xs text-slate-500">
          SCHEDULE: {cursor}/{schedule.length}
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-3">
          <TransactionLane
            name="TX 1 · WRITER"
            color="cyan"
            events={
              cursor > 0 ? ['write $120', ...(balanceCommitted ? ['COMMIT'] : [])] : ['waiting']
            }
          />
          <TransactionLane
            name={`TX 2 · ${aborted ? 'ABORTED' : 'READER'}`}
            color={aborted ? 'rose' : 'violet'}
            events={events.filter(
              (event) => event.startsWith('T2') || event.startsWith('Deadlock'),
            )}
          />
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
            <p className="font-mono text-[10px] text-slate-500">CURRENT TRANSACTION RULE</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{transactionText}</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="flex items-center gap-2 font-mono text-xs text-cyan-300">
            <Layers3 size={15} /> SHARED ROW · VERSION CHAIN
          </h3>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <VersionCard value="$100" label="v1 · committed" active={!balanceCommitted} />
            <span className="font-mono text-slate-600">←</span>
            <VersionCard
              value="$120"
              label={balanceCommitted ? 'v2 · committed' : 'v2 · T1 pending'}
              active={balanceCommitted}
              pending={!balanceCommitted}
            />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-800 p-3">
              <p className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                <Eye size={12} /> TX 2 READ
              </p>
              <p className="mt-2 font-mono text-xl text-white">{latestRead}</p>
            </div>
            <div className="rounded-lg border border-slate-800 p-3">
              <p className="font-mono text-[10px] text-slate-500">RANGE QUERY · status = 'open'</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-sm text-white">
                {cursor >= 6 && phantomInserted && isolation !== 'Serializable'
                  ? '2 rows'
                  : '1 row'}
                {cursor >= 6 && phantomInserted && isolation !== 'Serializable' && (
                  <span className="text-amber-300">+ phantom</span>
                )}
              </p>
            </div>
          </div>
          {aborted && (
            <p
              aria-live="polite"
              className="mt-3 flex items-center gap-2 rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-3 font-mono text-xs text-rose-200"
            >
              <AlertOctagon size={14} /> T2 rolled back to release its locks.
            </p>
          )}
        </section>
      </div>

      <ol
        aria-label="Transaction event log"
        className="mt-4 max-h-36 space-y-1 overflow-auto rounded-lg bg-slate-950/70 p-3"
      >
        {events.length ? (
          events.map((event, index) => (
            <li
              className="font-mono text-[10px] leading-5 text-slate-400"
              key={`${index}-${event}`}
            >
              {String(index + 1).padStart(2, '0')} · {event}
            </li>
          ))
        ) : (
          <li className="flex items-center gap-2 font-mono text-[10px] text-slate-600">
            <ShieldCheck size={12} /> Step to execute the concurrent schedule.
          </li>
        )}
      </ol>
    </LessonFrame>
  );
}

function TransactionLane({
  name,
  color,
  events,
}: {
  name: string;
  color: 'cyan' | 'violet' | 'rose';
  events: string[];
}) {
  const palette = {
    cyan: 'border-cyan-500/25 text-cyan-300',
    violet: 'border-violet-500/25 text-violet-300',
    rose: 'border-rose-500/25 text-rose-300',
  };
  return (
    <section className={`rounded-xl border bg-slate-950/70 p-3 ${palette[color]}`}>
      <h3 className="font-mono text-[10px]">{name}</h3>
      <div className="mt-2 flex min-h-8 flex-wrap gap-2">
        {events.map((event, index) => (
          <span
            className="rounded bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-300"
            key={`${event}-${index}`}
          >
            {event}
          </span>
        ))}
      </div>
    </section>
  );
}

function VersionCard({
  value,
  label,
  active,
  pending = false,
}: {
  value: string;
  label: string;
  active: boolean;
  pending?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${pending ? 'border-amber-400/30 bg-amber-400/[0.04]' : active ? 'border-emerald-400/30 bg-emerald-400/[0.04]' : 'border-slate-700 bg-slate-900'}`}
    >
      <p className="font-mono text-lg text-white">{value}</p>
      <p className={`mt-1 font-mono text-[9px] ${pending ? 'text-amber-300' : 'text-slate-500'}`}>
        {label}
      </p>
    </div>
  );
}
