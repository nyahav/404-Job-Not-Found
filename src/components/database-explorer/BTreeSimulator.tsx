import { motion } from 'framer-motion';
import { useCallback, useState } from 'react';
import LessonFrame from './LessonFrame';
import { usePlayback } from './usePlayback';

interface Page {
  id: string;
  keys: number[];
}

const initialLeaves: Page[] = [
  { id: 'B', keys: [10, 20] },
  { id: 'C', keys: [40, 50] },
  { id: 'D', keys: [70, 80] },
];
const inserts = [5, 15, 25];

export default function BTreeSimulator() {
  const [rootKeys, setRootKeys] = useState([30, 60]);
  const [leaves, setLeaves] = useState(initialLeaves);
  const [insertCount, setInsertCount] = useState(0);
  const [highlighted, setHighlighted] = useState('');
  const [message, setMessage] = useState('Insert rows to fill a leaf page. Capacity: 4 keys.');
  const complete = insertCount >= inserts.length;

  const step = useCallback(() => {
    if (insertCount >= inserts.length) return;

    const value = inserts[insertCount];
    if (value === undefined) return;
    const leafIndex = rootKeys.findIndex((separator) => value < separator);
    const targetIndex = leafIndex === -1 ? leaves.length - 1 : leafIndex;
    const target = leaves[targetIndex];
    if (!target) return;

    const nextLeaves = leaves.map((leaf, index) =>
      index === targetIndex ? { ...leaf, keys: [...leaf.keys, value].sort((a, b) => a - b) } : leaf,
    );
    const updated = nextLeaves[targetIndex];
    if (!updated) return;

    setHighlighted(updated.id);
    if (updated.keys.length > 4) {
      const middle = Math.floor(updated.keys.length / 2);
      const separator = updated.keys[middle];
      if (separator === undefined) return;
      const left = { ...updated, keys: updated.keys.slice(0, middle) };
      const right = {
        id: String.fromCharCode(69 + (leaves.length - initialLeaves.length)),
        keys: updated.keys.slice(middle + 1),
      };
      nextLeaves.splice(targetIndex, 1, left, right);
      setRootKeys((keys) => [...keys, separator].sort((a, b) => a - b));
      setMessage(
        `Page ${updated.id} overflowed. Promoted ${separator} to the parent and split the page.`,
      );
      setHighlighted(right.id);
    } else {
      setMessage(
        `Inserted ${value} into page ${updated.id}. Page now has ${updated.keys.length}/4 keys.`,
      );
    }

    setLeaves(nextLeaves);
    setInsertCount((count) => count + 1);
  }, [insertCount, leaves, rootKeys]);

  const { isPlaying, advance, stop, toggle } = usePlayback(step, complete);

  const reset = () => {
    stop();
    setRootKeys([30, 60]);
    setLeaves(initialLeaves);
    setInsertCount(0);
    setHighlighted('');
    setMessage('Insert rows to fill a leaf page. Capacity: 4 keys.');
  };

  return (
    <LessonFrame
      complete={complete}
      description="Watch a sorted page overflow, split into siblings, and promote its middle key so the tree stays balanced."
      eyebrow="Storage engine · B-Tree"
      isPlaying={isPlaying}
      onReset={reset}
      onStep={advance}
      onToggle={toggle}
      title="B-Tree page split"
      why="B-Trees keep lookup depth bounded as tables grow. A page split is an expensive write: databases must update the parent and preserve ordering, which is why fill factor, page size, and write patterns affect latency."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-mono text-xs text-slate-500">PAGE CAPACITY: 4 KEYS</span>
        <button
          className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200 transition hover:border-cyan-400/50 disabled:opacity-40"
          disabled={complete}
          onClick={advance}
          type="button"
        >
          Insert Row {complete ? '✓' : `(${inserts[insertCount]})`}
        </button>
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="mx-auto max-w-3xl min-w-[560px]">
          <div className="flex justify-center">
            <div className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-5 py-3 text-center">
              <p className="font-mono text-xs text-cyan-300">NODE A · ROOT</p>
              <div className="mt-2 flex justify-center gap-2">
                {rootKeys.map((key) => (
                  <span
                    className="rounded bg-slate-950/80 px-2 py-1 font-mono text-sm text-white"
                    key={key}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <svg aria-hidden="true" className="h-14 w-full" viewBox="0 0 600 60">
            {leaves.map((leaf, index) => {
              const x = 70 + (index * 460) / Math.max(leaves.length - 1, 1);
              return <path d={`M300 0 L${x} 60`} key={leaf.id} stroke="#334155" strokeWidth="2" />;
            })}
          </svg>
          <div className="flex justify-center gap-4">
            {leaves.map((leaf) => (
              <motion.div
                animate={{ scale: highlighted === leaf.id ? [1, 1.04, 1] : 1 }}
                className={`min-w-28 rounded-xl border p-3 text-center transition-colors ${
                  highlighted === leaf.id
                    ? 'border-amber-400/70 bg-amber-400/10'
                    : 'border-slate-700 bg-slate-950/70'
                }`}
                key={leaf.id}
              >
                <p className="font-mono text-xs text-slate-500">NODE {leaf.id}</p>
                <div className="mt-2 flex justify-center gap-1">
                  {leaf.keys.map((key) => (
                    <span
                      className="rounded bg-slate-800 px-1.5 py-1 font-mono text-xs text-slate-200"
                      key={key}
                    >
                      {key}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
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
