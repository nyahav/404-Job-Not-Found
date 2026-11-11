import { MessageCircle, MessageSquareText, ThumbsDown, ThumbsUp } from 'lucide-react';
import HelpTip from './HelpTip';
import { teammates } from './scenario';
import type { Clue } from './types';

type Response = 'follow' | 'question' | 'ignore';

interface Props {
  elapsedSeconds: number;
  discoveredClues: Clue[];
  responses: Record<string, Response>;
  onRespond: (teammateId: string, response: Response, suggestedAction: string | null) => void;
}

export default function TeamChat({ elapsedSeconds, discoveredClues, responses, onRespond }: Props) {
  const foundHitRate = discoveredClues.some((clue) => clue.id === 'c_hit_rate');
  const messages = teammates.filter((teammate) => {
    if (teammate.trigger === 'start') return true;
    if (teammate.trigger === 'c_hit_rate') return foundHitRate;
    return elapsedSeconds >= 120;
  });

  return (
    <section
      aria-label="Team incident chat"
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"
    >
      <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <h2 className="flex items-center gap-1 font-mono text-xs font-semibold tracking-wider text-slate-200">
          <MessageCircle aria-hidden="true" className="text-cyan-300" size={15} /> TEAM CHAT
          <HelpTip label="About team chat">
            Teammates share observations and suggestions as evidence arrives. You decide whether to
            follow a suggestion, ask for evidence, or ignore it.
          </HelpTip>
        </h2>
        <span className="font-mono text-[9px] text-slate-600">#incident-checkout</span>
      </header>
      <div className="space-y-3 p-3">
        {messages.map((teammate) => {
          const response = responses[teammate.id];
          return (
            <article
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
              key={teammate.id}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-200">
                  {teammate.name}{' '}
                  <span className="font-normal text-slate-600">· {teammate.role}</span>
                </p>
                <span className="font-mono text-[9px] text-slate-600">
                  {teammate.trigger === 'start'
                    ? 'NOW'
                    : teammate.trigger === 'c_hit_rate'
                      ? 'LIVE'
                      : '00:02'}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-400">“{teammate.message}”</p>
              {response ? (
                <p
                  aria-live="polite"
                  className="mt-3 flex items-center gap-1.5 font-mono text-[9px] text-cyan-300"
                >
                  <MessageSquareText aria-hidden="true" size={12} />
                  {response === 'follow'
                    ? teammate.suggests
                      ? 'Suggestion added to the change palette.'
                      : 'Suggestion noted.'
                    : response === 'question'
                      ? 'You asked for supporting evidence before acting.'
                      : 'Suggestion ignored.'}
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px] text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
                    onClick={() => onRespond(teammate.id, 'follow', teammate.suggests)}
                    type="button"
                  >
                    <ThumbsUp aria-hidden="true" size={11} /> Follow
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px] text-slate-400 transition hover:border-cyan-400/40 hover:text-cyan-200"
                    onClick={() => onRespond(teammate.id, 'question', teammate.suggests)}
                    type="button"
                  >
                    <MessageSquareText aria-hidden="true" size={11} /> Ask why
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[10px] text-slate-500 transition hover:border-rose-400/30 hover:text-rose-200"
                    onClick={() => onRespond(teammate.id, 'ignore', teammate.suggests)}
                    type="button"
                  >
                    <ThumbsDown aria-hidden="true" size={11} /> Ignore
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
