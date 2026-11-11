import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        aria-label="Decrease count"
        className="grid size-10 place-items-center rounded-full border border-slate-700 text-lg transition hover:border-cyan-400 hover:text-cyan-300"
        onClick={() => setCount((value) => value - 1)}
        type="button"
      >
        −
      </button>
      <output aria-live="polite" className="min-w-8 text-center text-xl font-semibold text-white">
        {count}
      </output>
      <button
        aria-label="Increase count"
        className="grid size-10 place-items-center rounded-full border border-slate-700 text-lg transition hover:border-cyan-400 hover:text-cyan-300"
        onClick={() => setCount((value) => value + 1)}
        type="button"
      >
        +
      </button>
    </div>
  );
}
