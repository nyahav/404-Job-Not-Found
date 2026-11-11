import { ArrowDown, ArrowDownUp, Cpu, HardDrive, MemoryStick } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import LessonFrame from './LessonFrame';
import { usePlayback } from './usePlayback';

const CAPACITY = 4;
const MAX_WRITES = 16;

export default function LSMTreeSimulator() {
  const [memtable, setMemtable] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[][][]>([[], [], []]);
  const [writeCount, setWriteCount] = useState(0);
  const [customValue, setCustomValue] = useState('');
  const [message, setMessage] = useState(
    'Writes land in RAM first. Four entries trigger an SSTable flush.',
  );
  const complete = writeCount >= MAX_WRITES;

  const insert = useCallback(
    (value: string) => {
      if (!value.trim() || writeCount >= MAX_WRITES) return;
      let nextMemtable = [...memtable, value.trim()];
      const nextLevels = levels.map((level) => [...level]);
      let result = `Wrote "${value}" to the MemTable (${nextMemtable.length}/${CAPACITY}).`;

      if (nextMemtable.length >= CAPACITY) {
        nextLevels[0]?.push(nextMemtable);
        result = `MemTable reached capacity; flushed ${nextMemtable.length} sorted records to L0.`;
        nextMemtable = [];

        for (let levelIndex = 0; levelIndex < 2; levelIndex += 1) {
          const current = nextLevels[levelIndex];
          if (!current || current.length < 2) continue;
          const merged = current.flat().sort((a, b) => a.localeCompare(b));
          nextLevels[levelIndex] = [];
          nextLevels[levelIndex + 1]?.push(merged);
          result += ` Compaction merged ${current.length} runs into L${levelIndex + 1}.`;
        }
      }

      setMemtable(nextMemtable);
      setLevels(nextLevels);
      setWriteCount((count) => count + 1);
      setMessage(result);
    },
    [levels, memtable, writeCount],
  );

  const step = useCallback(() => {
    insert(`key_${String(writeCount + 1).padStart(2, '0')}`);
  }, [insert, writeCount]);
  const { isPlaying, advance, stop, toggle } = usePlayback(step, complete);

  const reset = () => {
    stop();
    setMemtable([]);
    setLevels([[], [], []]);
    setWriteCount(0);
    setMessage('Writes land in RAM first. Four entries trigger an SSTable flush.');
  };

  const submitCustom: NonNullable<ComponentProps<'form'>['onSubmit']> = (event) => {
    event.preventDefault();
    if (!customValue.trim()) return;
    insert(customValue);
    setCustomValue('');
  };

  return (
    <LessonFrame
      complete={complete}
      description="Trace a write from the in-memory buffer to sorted disk runs, then watch leveled compaction merge overlapping files."
      eyebrow="Storage engine · LSM-Tree"
      isPlaying={isPlaying}
      onReset={reset}
      onStep={advance}
      onToggle={toggle}
      title="LSM-Tree write path"
      why="LSM engines trade read amplification for fast sequential writes. Compaction controls disk space and read cost, but consumes background I/O and CPU; production systems tune thresholds to avoid write stalls and latency spikes."
    >
      <form className="flex flex-wrap gap-2" onSubmit={submitCustom}>
        <label className="sr-only" htmlFor="lsm-write-value">
          Record key or value
        </label>
        <input
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500/50"
          disabled={complete}
          id="lsm-write-value"
          maxLength={24}
          onChange={(event) => setCustomValue(event.target.value)}
          placeholder="e.g. customer_42"
          value={customValue}
        />
        <button
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-400/50 disabled:opacity-40"
          disabled={complete || !customValue.trim()}
          type="submit"
        >
          Write value
        </button>
      </form>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] lg:items-stretch">
        <Tier title="MemTable · RAM" icon={<MemoryStick size={18} />} accent="cyan">
          {memtable.length ? (
            memtable.map((entry, index) => <Record key={`${entry}-${index}`}>{entry}</Record>)
          ) : (
            <Empty>awaiting writes</Empty>
          )}
          <span className="mt-2 font-mono text-[10px] text-slate-500">
            {memtable.length}/{CAPACITY} slots
          </span>
        </Tier>
        <div className="hidden items-center justify-center text-slate-600 lg:flex">
          <ArrowDown size={18} />
        </div>
        <Tier title="SSTables · Disk" icon={<HardDrive size={18} />} accent="blue">
          {[0, 1, 2].map((levelIndex) => (
            <div
              className="flex gap-2 border-b border-slate-800/80 py-2 last:border-0"
              key={levelIndex}
            >
              <span className="w-7 shrink-0 pt-1 font-mono text-[10px] text-slate-500">
                L{levelIndex}
              </span>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {levels[levelIndex]?.length ? (
                  levels[levelIndex]?.map((run, runIndex) => (
                    <div
                      className="rounded-md border border-blue-400/20 bg-blue-400/[0.06] p-1.5"
                      key={`${levelIndex}-${runIndex}`}
                    >
                      <p className="font-mono text-[9px] text-blue-300">SST {runIndex + 1}</p>
                      <p className="mt-1 max-w-40 truncate font-mono text-[9px] text-slate-400">
                        {run.join(' · ')}
                      </p>
                    </div>
                  ))
                ) : (
                  <span className="pt-1 font-mono text-[10px] text-slate-700">empty</span>
                )}
              </div>
            </div>
          ))}
        </Tier>
        <div className="hidden items-center justify-center text-amber-300/70 lg:flex">
          <ArrowDownUp size={18} />
        </div>
        <Tier title="Compaction engine" icon={<Cpu size={18} />} accent="amber">
          <p className="font-mono text-xs text-slate-400">L0 trigger: 2 runs</p>
          <p className="mt-2 font-mono text-xs text-slate-400">Sorted merge → next level</p>
          <p className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] text-amber-300">
            <ArrowDownUp size={12} /> BACKGROUND I/O
          </p>
        </Tier>
      </div>
      <p
        aria-live="polite"
        className="mt-4 rounded-lg bg-slate-950/70 px-3 py-2 font-mono text-xs text-slate-400"
      >
        {message}
      </p>
    </LessonFrame>
  );
}

function Tier({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: ReactNode;
  accent: 'cyan' | 'blue' | 'amber';
  children: ReactNode;
}) {
  const colors = {
    cyan: 'border-cyan-500/20 text-cyan-300',
    blue: 'border-blue-500/20 text-blue-300',
    amber: 'border-amber-500/20 text-amber-300',
  };
  return (
    <section className={`rounded-xl border bg-slate-950/70 p-3 ${colors[accent]}`}>
      <h3 className="mb-3 flex items-center gap-2 font-mono text-xs">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

function Record({ children }: { children: string }) {
  return (
    <span className="rounded bg-cyan-400/10 px-2 py-1 font-mono text-[10px] text-cyan-200">
      {children}
    </span>
  );
}

function Empty({ children }: { children: string }) {
  return <span className="font-mono text-[10px] text-slate-600">{children}</span>;
}
