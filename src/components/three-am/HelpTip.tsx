import { CircleHelp, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  label: string;
  children: string;
}

export default function HelpTip({ label, children }: Props) {
  const tooltipId = useId();
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useEffect(() => {
    if (!position) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPosition(null);
    };
    const closeOnViewportChange = () => setPosition(null);
    window.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, true);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, true);
    };
  }, [position]);

  const toggleTip = (button: HTMLButtonElement) => {
    if (position) {
      setPosition(null);
      return;
    }

    const bounds = button.getBoundingClientRect();
    setPosition({
      left: Math.max(12, Math.min(bounds.left, window.innerWidth - 284)),
      top: Math.min(bounds.bottom + 8, window.innerHeight - 150),
    });
  };

  return (
    <>
      <button
        aria-controls={tooltipId}
        aria-expanded={position !== null}
        aria-label={label}
        className="inline-grid size-6 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-800 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
        onClick={(event) => toggleTip(event.currentTarget)}
        type="button"
      >
        <CircleHelp aria-hidden="true" size={14} />
      </button>
      {position &&
        createPortal(
          <div
            className="fixed z-[100] w-[272px] rounded-xl border border-cyan-400/25 bg-slate-900 p-3 pr-9 text-left text-xs leading-5 text-slate-300 shadow-2xl shadow-black/50"
            id={tooltipId}
            aria-label={label}
            role="dialog"
            style={{ left: position.left, top: position.top }}
          >
            {children}
            <button
              aria-label="Close explanation"
              className="absolute top-2 right-2 grid size-6 place-items-center rounded text-slate-500 hover:text-white"
              onClick={() => setPosition(null)}
              type="button"
            >
              <X aria-hidden="true" size={13} />
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
