import { AnimatePresence, motion } from 'framer-motion';
import {
  GitBranch,
  Layers3,
  LockKeyhole,
  Search,
  ShieldAlert,
  TableProperties,
} from 'lucide-react';
import { useState } from 'react';
import BTreeSimulator from './BTreeSimulator';
import LSMTreeSimulator from './LSMTreeSimulator';
import MVCCSandbox from './MVCCSandbox';
import QueryOptimizerSimulator from './QueryOptimizerSimulator';
import WALRecoverySimulator from './WALRecoverySimulator';

const lessons = [
  { id: 'btree', label: 'B-Tree Splits', icon: GitBranch },
  { id: 'lsm', label: 'LSM Write Path', icon: Layers3 },
  { id: 'wal', label: 'WAL Recovery', icon: ShieldAlert },
  { id: 'mvcc', label: 'MVCC & Isolation', icon: LockKeyhole },
  { id: 'optimizer', label: 'Query Optimizer', icon: Search },
] as const;

type LessonId = (typeof lessons)[number]['id'];

export default function DatabaseExplorerApp() {
  const [activeLesson, setActiveLesson] = useState<LessonId>('btree');
  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeLesson);

  return (
    <div className="w-full">
      <header className="relative overflow-hidden border-b border-slate-800 bg-slate-900/35">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.10),transparent_55%)]"
        />
        <div className="relative mx-auto max-w-7xl px-6 py-14 text-center sm:py-20">
          <span className="mx-auto grid size-12 place-items-center rounded-xl border border-cyan-500/25 bg-cyan-500/10 text-cyan-300">
            <TableProperties aria-hidden="true" size={23} />
          </span>
          <p className="mt-5 font-mono text-xs tracking-[0.2em] text-cyan-300 uppercase">
            Database Explorer · Interactive Lab
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Databases under load.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
            Step inside the storage engines, recovery systems, and concurrency controls that keep
            production data fast, consistent, and durable.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['STORAGE ENGINES', 'CRASH RECOVERY', 'CONCURRENCY', 'QUERY PLANNING'].map((topic) => (
              <span
                className="rounded-full border border-slate-700/80 bg-slate-950/60 px-3 py-1.5 font-mono text-[10px] tracking-wide text-slate-400"
                key={topic}
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      </header>

      <section
        aria-label="Database lesson simulators"
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"
      >
        <nav
          aria-label="Database lessons"
          className="mb-7 flex gap-2 overflow-x-auto border-b border-slate-800 pb-3"
          role="tablist"
        >
          {lessons.map((lesson, index) => {
            const Icon = lesson.icon;
            const active = lesson.id === activeLesson;
            return (
              <button
                aria-selected={active}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'border border-cyan-500/20 bg-cyan-500/10 text-cyan-200'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                id={`database-lesson-tab-${lesson.id}`}
                key={lesson.id}
                onClick={() => setActiveLesson(lesson.id)}
                role="tab"
                type="button"
              >
                <span className="font-mono text-[10px] text-slate-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Icon aria-hidden="true" size={15} />
                {lesson.label}
              </button>
            );
          })}
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 8 }}
            key={activeLesson}
            role="tabpanel"
            aria-labelledby={`database-lesson-tab-${activeLesson}`}
            transition={{ duration: 0.18 }}
          >
            {activeLesson === 'btree' && <BTreeSimulator />}
            {activeLesson === 'lsm' && <LSMTreeSimulator />}
            {activeLesson === 'wal' && <WALRecoverySimulator />}
            {activeLesson === 'mvcc' && <MVCCSandbox />}
            {activeLesson === 'optimizer' && <QueryOptimizerSimulator />}
          </motion.div>
        </AnimatePresence>

        <p className="mt-8 text-center font-mono text-[10px] text-slate-600">
          LESSON {String(activeIndex + 1).padStart(2, '0')} /{' '}
          {String(lessons.length).padStart(2, '0')} · &nbsp;SIMULATIONS ARE EDUCATIONAL MODELS
        </p>
      </section>
    </div>
  );
}
