import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Brain, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { quizQuestions } from './data';
import type { ArchitectureProject, QuizQuestion } from './types';

type Answer = {
  selected: number;
  correct: number;
};

const categoryDetails: Record<QuizQuestion['category'], { label: string; color: string }> = {
  service_roles: { label: 'Service roles', color: '#38bdf8' },
  iam_policy: { label: 'IAM & security', color: '#c084fc' },
  best_practices: { label: 'Best practices', color: '#4ade80' },
};

export default function QuizTab({ project }: { project: ArchitectureProject }) {
  const questions = useMemo(
    () => quizQuestions.filter((question) => question.project_id === project.id),
    [project.id],
  );
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);

  const score = answers.filter((answer) => answer.selected === answer.correct).length;
  const reset = () => {
    setStarted(true);
    setCurrent(0);
    setSelected(null);
    setAnswers([]);
    setRevealed(false);
    setFinished(false);
  };
  const checkAnswer = () => {
    if (selected === null || revealed) return;
    const correct = questions[current].correct;
    setAnswers((previous) => [...previous, { selected, correct }]);
    setRevealed(true);
  };
  const nextQuestion = () => {
    if (current === questions.length - 1) {
      setFinished(true);
      return;
    }
    setCurrent((index) => index + 1);
    setSelected(null);
    setRevealed(false);
  };

  if (questions.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <Brain aria-hidden="true" className="mx-auto text-slate-500" size={32} />
        <h2 className="mt-4 text-xl font-semibold text-white">No questions available</h2>
        <p className="mt-2 text-sm text-slate-400">
          This architecture does not have any quiz questions yet.
        </p>
      </div>
    );
  }

  if (!started) {
    const categoryCounts = questions.reduce<Record<string, number>>((counts, question) => {
      counts[question.category] = (counts[question.category] ?? 0) + 1;
      return counts;
    }, {});

    return (
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center sm:p-10">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          <Brain aria-hidden="true" size={30} />
        </span>
        <p className="mt-5 text-sm font-medium tracking-[0.18em] text-cyan-300 uppercase">
          Knowledge check
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">Test your knowledge</h2>
        <p className="mt-3 text-slate-300">{project.name}</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {Object.entries(categoryCounts).map(([category, count]) => {
            const details = categoryDetails[category as QuizQuestion['category']];
            if (!details) return null;

            return (
              <div
                className="rounded-xl border p-4"
                key={category}
                style={{ backgroundColor: `${details.color}0c`, borderColor: `${details.color}30` }}
              >
                <p className="text-2xl font-bold" style={{ color: details.color }}>
                  {count}
                </p>
                <p className="mt-1 text-xs text-slate-300">{details.label}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm leading-7 text-slate-400">
          {questions.length} questions about service roles, IAM policies, and production
          best-practices. Choose an answer and check it to see the explanation.
        </p>
        <button
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-semibold text-slate-950 transition hover:bg-cyan-300 sm:w-auto sm:min-w-48"
          onClick={reset}
          type="button"
        >
          Start quiz <ArrowRight aria-hidden="true" size={17} />
        </button>
      </section>
    );
  }

  if (finished) {
    const percentage = Math.round((score / questions.length) * 100);
    const medal = percentage >= 80 ? '🏆' : percentage >= 50 ? '👍' : '📚';

    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 text-center">
          <span aria-hidden="true" className="text-5xl">
            {medal}
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white">Quiz complete!</h2>
          <p className="mt-4 text-5xl font-black text-cyan-300">
            {score}
            <span className="text-2xl text-slate-500"> / {questions.length}</span>
          </p>
          <p className="mt-2 text-slate-400">{percentage}% correct</p>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => {
            const answer = answers[index];
            const correct = answer?.selected === question.correct;
            const details = categoryDetails[question.category];

            return (
              <article
                className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
                key={question.id}
              >
                {correct ? (
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-emerald-300"
                    size={17}
                  />
                ) : (
                  <XCircle aria-hidden="true" className="mt-0.5 shrink-0 text-red-300" size={17} />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm leading-6 font-medium text-white">{question.question}</h3>
                  {!correct && (
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Correct answer: {question.options[question.correct]}
                    </p>
                  )}
                  <p className="mt-2 text-xs leading-6 text-slate-400">{question.explanation}</p>
                </div>
                <span
                  className="shrink-0 rounded-full border px-2 py-1 text-[10px]"
                  style={{ borderColor: `${details.color}35`, color: details.color }}
                >
                  {details.label}
                </span>
              </article>
            );
          })}
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          onClick={reset}
          type="button"
        >
          <RotateCcw aria-hidden="true" size={16} /> Retry quiz
        </button>
      </section>
    );
  }

  const question = questions[current];
  const category = categoryDetails[question.category];
  const currentIsCorrect = selected === question.correct;

  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="rounded-full border px-3 py-1 text-xs font-medium"
          style={{ borderColor: `${category.color}40`, color: category.color }}
        >
          {category.label}
        </span>
        <span className="text-sm text-slate-400">
          Question {current + 1} of {questions.length}
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          animate={{ width: `${((current + 1) / questions.length) * 100}%` }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div animate={{ opacity: 1, x: 0 }} initial={{ opacity: 0, x: 8 }} key={question.id}>
          <h2 className="mt-7 text-xl leading-8 font-semibold text-white sm:text-2xl">
            {question.question}
          </h2>
          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">Choose your answer</legend>
            {question.options.map((option, index) => {
              const isSelected = selected === index;
              const isCorrectOption = index === question.correct;
              let borderColor = 'border-slate-700';
              let backgroundColor = 'bg-slate-950/40';
              if (!revealed && isSelected) {
                borderColor = 'border-cyan-400/60';
                backgroundColor = 'bg-cyan-400/5';
              } else if (revealed && isCorrectOption) {
                borderColor = 'border-emerald-400/40';
                backgroundColor = 'bg-emerald-400/5';
              } else if (revealed && isSelected) {
                borderColor = 'border-red-400/40';
                backgroundColor = 'bg-red-400/5';
              }

              return (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${borderColor} ${backgroundColor} ${
                    revealed ? 'cursor-default' : 'hover:border-slate-500'
                  }`}
                  key={`${question.id}-${index}`}
                >
                  <input
                    checked={isSelected}
                    className="mt-1 accent-cyan-400"
                    disabled={revealed}
                    name={`question-${question.id}`}
                    onChange={() => setSelected(index)}
                    type="radio"
                    value={index}
                  />
                  <span className="flex-1 text-sm leading-6 text-slate-200">{option}</span>
                  {revealed && isCorrectOption && (
                    <CheckCircle2
                      aria-hidden="true"
                      className="shrink-0 text-emerald-300"
                      size={17}
                    />
                  )}
                  {revealed && isSelected && !isCorrectOption && (
                    <XCircle aria-hidden="true" className="shrink-0 text-red-300" size={17} />
                  )}
                </label>
              );
            })}
          </fieldset>
        </motion.div>
      </AnimatePresence>

      {revealed && (
        <div
          className={`mt-5 rounded-xl border p-4 ${
            currentIsCorrect
              ? 'border-emerald-400/20 bg-emerald-400/5 text-emerald-100'
              : 'border-amber-400/20 bg-amber-400/5 text-amber-100'
          }`}
          role="status"
        >
          <p className="font-semibold">{currentIsCorrect ? 'Correct!' : 'Not quite.'}</p>
          <p className="mt-1 text-sm leading-7 text-slate-300">{question.explanation}</p>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {revealed ? (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            onClick={nextQuestion}
            type="button"
          >
            {current === questions.length - 1 ? 'View results' : 'Next question'}
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        ) : (
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selected === null}
            onClick={checkAnswer}
            type="button"
          >
            <Sparkles aria-hidden="true" size={16} /> Check answer
          </button>
        )}
      </div>
    </section>
  );
}
