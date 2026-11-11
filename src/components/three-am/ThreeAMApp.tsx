import { motion } from 'framer-motion';
import {
  AlarmClock,
  ArrowDown,
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ActionPalette from './ActionPalette';
import { getAvailableClues, resolveActions, validateClaim } from './engine';
import EvidenceWall from './EvidenceWall';
import HelpTip from './HelpTip';
import IncidentDashboard from './IncidentDashboard';
import PostMortem from './PostMortem';
import { scenario } from './scenario';
import TeamChat from './TeamChat';
import Toolbelt from './Toolbelt';
import TutorialDialog, { saveTutorialPreference, shouldShowTutorial } from './TutorialDialog';
import { useIncidentSound } from './useIncidentSound';
import type {
  ActionResolution,
  Claim,
  ClaimSlot,
  Clue,
  IncidentPhase,
  OutcomeKind,
  ToolId,
} from './types';

type TeammateResponse = 'follow' | 'question' | 'ignore';

const phases: { id: IncidentPhase; label: string }[] = [
  { id: 'investigate', label: 'Investigate' },
  { id: 'diagnose', label: 'Diagnose' },
  { id: 'fix', label: 'Fix' },
  { id: 'replay', label: 'Replay' },
  { id: 'postmortem', label: 'Post-mortem' },
];

const hintMessages = [
  'Start with what changed around 12:00. Scrub back before the spike, then compare the cache and database signals.',
  'A falling cache hit rate can turn ordinary, fast reads into a database traffic wave. Inspect it, then check the earlier configuration.',
  'Every product key shares a fixed 3,600-second TTL from the 11:00 bulk load. Use TTL jitter and request coalescing together.',
];

const emptyClaim: Claim = { trigger: '', mechanism: '', effect: '' };

export default function ThreeAMApp() {
  const [phase, setPhase] = useState<IncidentPhase>('alert');
  const [furthestPhaseIndex, setFurthestPhaseIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scrubMinute, setScrubMinute] = useState(65);
  const [activeTool, setActiveTool] = useState<ToolId>('metrics');
  const [lookupsUsed, setLookupsUsed] = useState(0);
  const [discoveredClues, setDiscoveredClues] = useState<Clue[]>([]);
  const [claim, setClaim] = useState<Claim>(emptyClaim);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [diagnosis, setDiagnosis] = useState<ReturnType<typeof validateClaim> | null>(null);
  const [diagnosisSubmitted, setDiagnosisSubmitted] = useState(false);
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);
  const [suggestedActionIds, setSuggestedActionIds] = useState<string[]>([]);
  const [resolutions, setResolutions] = useState<Record<string, TeammateResponse>>({});
  const [ignoredSenior, setIgnoredSenior] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [resolution, setResolution] = useState<ActionResolution | null>(null);
  const [outcome, setOutcome] = useState<OutcomeKind | null>(null);
  const [replayMinute, setReplayMinute] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [codexUnlocked, setCodexUnlocked] = useState(false);
  const [codexError, setCodexError] = useState('');
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const {
    enabled: soundEnabled,
    error: soundError,
    toggle: toggleSound,
    playPager,
  } = useIncidentSound(['investigate', 'diagnose', 'fix'].includes(phase));

  const lookupLimit = scenario.budget.lookups;
  const ticketsUsed = selectedActionIds.length;
  const totalCost = useMemo(
    () =>
      selectedActionIds.reduce((total, id) => {
        const action = resolveActions([id]).actions[0];
        return total + (action?.action.costUsd ?? 0);
      }, 0),
    [selectedActionIds],
  );
  const finalElapsedSeconds =
    elapsedSeconds +
    (resolution && outcome
      ? (outcome === 'fixed' ? resolution.timeMin + 3 : Math.max(20, resolution.timeMin)) * 60
      : 0);
  const displayedElapsedSeconds =
    phase === 'replay' && resolution && outcome
      ? elapsedSeconds +
        Math.min(replayMinute, outcome === 'fixed' ? resolution.timeMin + 3 : 20) * 60
      : phase === 'postmortem'
        ? finalElapsedSeconds
        : elapsedSeconds;
  const activeIncident =
    phase === 'alert' || phase === 'investigate' || phase === 'diagnose' || phase === 'fix';

  const navigatePhase = (nextPhase: IncidentPhase) => {
    const nextIndex = phases.findIndex((item) => item.id === nextPhase);
    setFurthestPhaseIndex((furthest) =>
      nextIndex < furthest ? nextIndex : Math.max(furthest, nextIndex),
    );
    if (
      ['replay', 'postmortem'].includes(phase) &&
      nextIndex < phases.findIndex((item) => item.id === 'replay')
    ) {
      setResolution(null);
      setOutcome(null);
      setReplayMinute(0);
      setReplayPlaying(false);
    }
    if (
      ['investigate', 'diagnose'].includes(nextPhase) &&
      (phase === 'fix' || phase === 'replay' || phase === 'postmortem')
    ) {
      setDiagnosis(null);
      setDiagnosisSubmitted(false);
    }
    setPhase(nextPhase);
  };

  useEffect(() => {
    try {
      setCodexUnlocked(window.localStorage.getItem('three-am-codex') === scenario.rootConcept);
    } catch {
      setCodexError(
        'Your browser blocked local progress storage; this incident can still be played.',
      );
    }
  }, []);

  useEffect(() => {
    if (!['investigate', 'diagnose', 'fix'].includes(phase)) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'postmortem' || outcome !== 'fixed') return;
    try {
      window.localStorage.setItem('three-am-codex', scenario.rootConcept);
      setCodexUnlocked(true);
      setCodexError('');
    } catch {
      setCodexError(
        'Your pattern was solved, but browser privacy settings prevented saving the Codex card.',
      );
    }
  }, [outcome, phase]);

  useEffect(() => {
    if (phase !== 'replay' || !replayPlaying || !resolution || !outcome) return;
    const timer = window.setTimeout(() => {
      const next = Math.min(20, replayMinute + 1);
      setReplayMinute(next);
      if (next === 20) setReplayPlaying(false);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [outcome, phase, replayMinute, replayPlaying, resolution]);

  const lookupClue = (clue: Clue) => {
    const currentlyAvailable = getAvailableClues(
      scenario.clues,
      discoveredClues.map((item) => item.id),
      scrubMinute,
    );
    if (!currentlyAvailable.some((item) => item.id === clue.id) || lookupsUsed >= lookupLimit)
      return;
    setDiscoveredClues((items) => [...items, clue]);
    setLookupsUsed((count) => count + 1);
  };

  const updateClaim = (slot: ClaimSlot, value: string) => {
    setClaim((current) => ({ ...current, [slot]: value }));
  };

  const toggleEvidence = (clueId: string) => {
    setSelectedEvidenceIds((current) =>
      current.includes(clueId) ? current.filter((id) => id !== clueId) : [...current, clueId],
    );
  };

  const submitDiagnosis = () => {
    setDiagnosis(validateClaim(claim, selectedEvidenceIds));
    setDiagnosisSubmitted(true);
    navigatePhase('fix');
  };

  const toggleAction = (actionId: string) => {
    setSelectedActionIds((current) => {
      if (current.includes(actionId)) return current.filter((id) => id !== actionId);
      if (current.length >= scenario.budget.changeTickets) return current;
      return [...current, actionId];
    });
  };

  const startReplay = () => {
    if (!selectedActionIds.length) return;
    const result = resolveActions(selectedActionIds);
    setResolution(result);
    setOutcome(result.outcome);
    setReplayMinute(0);
    setReplayPlaying(true);
    navigatePhase('replay');
  };

  const resetReplay = () => {
    if (phase !== 'replay') return;
    setReplayMinute(0);
    setReplayPlaying(false);
  };

  const stepReplay = () => {
    if (replayMinute >= 20) return;
    const next = Math.min(20, replayMinute + 1);
    setReplayMinute(next);
    if (next >= 20) setReplayPlaying(false);
  };

  const respondToTeammate = (
    teammateId: string,
    response: TeammateResponse,
    suggestedAction: string | null,
  ) => {
    setResolutions((current) => ({ ...current, [teammateId]: response }));
    if (response === 'follow' && suggestedAction) {
      setSuggestedActionIds((current) =>
        current.includes(suggestedAction) ? current : [...current, suggestedAction],
      );
    }
    if (teammateId === 'dana' && response !== 'follow') setIgnoredSenior(true);
  };

  const inspectTool = (tool: ToolId) => {
    setActiveTool(tool);
    document.getElementById('incident-toolbelt')?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  const unlockCodex = () => {
    try {
      window.localStorage.setItem('three-am-codex', scenario.rootConcept);
      setCodexUnlocked(true);
      setCodexError('');
    } catch {
      setCodexError(
        'Could not save this pattern to local storage. Check your browser privacy settings.',
      );
    }
  };

  const takeHint = () => setHintLevel((level) => Math.min(3, level + 1));

  const acknowledgePager = () => {
    if (phase !== 'alert') return;
    playPager();
    navigatePhase('investigate');
  };

  const closeTutorial = useCallback((skipForSession: boolean) => {
    saveTutorialPreference(skipForSession);
    setTutorialOpen(false);
  }, []);

  useEffect(() => {
    setTutorialOpen(shouldShowTutorial());
  }, []);

  const currentPhaseIndex = phases.findIndex((item) => item.id === phase);
  const recoveryMinutes = resolution && outcome === 'fixed' ? resolution.timeMin + 3 : 20;

  return (
    <div className="min-h-[70vh] bg-slate-950">
      <header className="relative overflow-hidden border-b border-slate-800 bg-slate-900/35">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.07),transparent_58%)]"
        />
        <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-8 sm:px-6 sm:py-11">
          <div className="flex items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-amber-400/25 bg-amber-400/[0.06] text-amber-300">
              <AlarmClock aria-hidden="true" size={23} />
            </span>
            <div>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">
                3 AM · INCIDENT RESPONSE LAB
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-slate-400">
                Operate the incident. Find the cause. Keep the blast small.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100"
              onClick={() => setTutorialOpen(true)}
              type="button"
            >
              <BookOpen aria-hidden="true" size={14} /> How to play
            </button>
            <span className="hidden font-mono text-[9px] text-slate-600 sm:inline">
              SOUND IS OFF BY DEFAULT
            </span>
            <button
              aria-pressed={soundEnabled}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
                soundEnabled
                  ? 'border-amber-400/30 bg-amber-400/[0.06] text-amber-200'
                  : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white'
              }`}
              onClick={toggleSound}
              type="button"
            >
              {soundEnabled ? (
                <Volume2 aria-hidden="true" size={14} />
              ) : (
                <VolumeX aria-hidden="true" size={14} />
              )}
              {soundEnabled ? 'Sound on' : 'Muted'}
            </button>
          </div>
        </div>
      </header>

      <TutorialDialog onClose={closeTutorial} open={tutorialOpen} />

      <main className="mx-auto max-w-[1600px] space-y-5 px-3 py-5 sm:px-6 sm:py-7">
        {soundError && (
          <p
            aria-live="polite"
            className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-xs text-amber-200"
          >
            {soundError}
          </p>
        )}

        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <div className="space-y-3">
            {phase === 'alert' && (
              <section className="relative overflow-hidden rounded-2xl border border-rose-400/40 bg-rose-500/[0.06] p-4 sm:p-5">
                <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-rose-400" />
                <div className="flex flex-wrap items-start justify-between gap-4 pl-2">
                  <div className="flex gap-3">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg border border-rose-400/25 bg-rose-400/10 text-rose-300">
                      <AlarmClock aria-hidden="true" size={17} />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.16em] text-rose-300">
                        INCOMING PAGE · CHECKOUT · SEV-1
                      </p>
                      <h2 className="mt-1 text-xl font-bold text-white">{scenario.title}</h2>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                        {scenario.brief}
                      </p>
                    </div>
                  </div>
                  <button
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-300/35 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:border-rose-200/60 hover:bg-rose-400/15"
                    onClick={acknowledgePager}
                    type="button"
                  >
                    Acknowledge pager <ArrowRight aria-hidden="true" size={15} />
                  </button>
                </div>
              </section>
            )}

            {phase !== 'alert' && (
              <PhaseRail
                phase={phase}
                currentIndex={currentPhaseIndex}
                furthestIndex={furthestPhaseIndex}
                onNavigate={navigatePhase}
              />
            )}

            <IncidentDashboard
              elapsedSeconds={displayedElapsedSeconds}
              scrubMinute={scrubMinute}
              onScrub={setScrubMinute}
              onInspect={inspectTool}
              outcome={resolution ? outcome : null}
              replayMinute={replayMinute}
              actionTimeMin={resolution?.timeMin ?? 0}
              incidentActive={activeIncident}
            />

            {phase === 'replay' && resolution && outcome && (
              <ReplayControls
                minute={replayMinute}
                playing={replayPlaying}
                outcome={outcome}
                actionTime={resolution.timeMin}
                recoveryMinutes={recoveryMinutes}
                onMinuteChange={setReplayMinute}
                onPlay={() => setReplayPlaying((playing) => !playing)}
                onStep={stepReplay}
                onReset={resetReplay}
                onContinue={() => {
                  setReplayPlaying(false);
                  navigatePhase('postmortem');
                }}
              />
            )}
          </div>

          <aside className="space-y-4">
            <TeamChat
              elapsedSeconds={elapsedSeconds}
              discoveredClues={discoveredClues}
              responses={resolutions}
              onRespond={respondToTeammate}
            />

            {phase !== 'alert' && phase !== 'postmortem' && (
              <section className="rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-amber-200">
                    <CircleHelp aria-hidden="true" size={13} /> INCIDENT HINT
                  </p>
                  <button
                    className="font-mono text-[9px] text-slate-500 transition hover:text-amber-200 disabled:opacity-40"
                    disabled={hintLevel >= 3}
                    onClick={takeHint}
                    type="button"
                  >
                    {hintLevel >= 3 ? 'REVEAL USED' : `HINT ${hintLevel + 1}/3 · -8 SCORE`}
                  </button>
                </div>
                {hintLevel > 0 && (
                  <p className="mt-2 text-xs leading-5 text-slate-300">
                    {hintMessages[hintLevel - 1]}
                  </p>
                )}
              </section>
            )}

            {codexError && (
              <p
                aria-live="polite"
                className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-3 py-2 text-xs text-amber-200"
              >
                {codexError}
              </p>
            )}
          </aside>
        </div>

        {phase === 'investigate' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div id="incident-toolbelt">
              <Toolbelt
                scrubMinute={scrubMinute}
                discoveredClues={discoveredClues}
                lookupsUsed={lookupsUsed}
                lookupLimit={lookupLimit}
                activeTool={activeTool}
                onToolChange={setActiveTool}
                onLookup={lookupClue}
              />
            </div>
            <EvidenceWall
              phase={phase}
              clues={discoveredClues}
              claim={claim}
              evidenceIds={selectedEvidenceIds}
              diagnosisSubmitted={diagnosisSubmitted}
              onClaimChange={updateClaim}
              onEvidenceToggle={toggleEvidence}
              onContinue={() => navigatePhase('diagnose')}
              onCheckDiagnosis={submitDiagnosis}
            />
          </div>
        )}

        {phase === 'diagnose' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.035] p-4 sm:p-5">
              <p className="font-mono text-[10px] tracking-wider text-amber-200">
                BUILD THE CAUSAL CHAIN
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">What triggered the incident?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Connect the change, how it affected the system, and the production impact. Use the
                evidence wall to support your claim; symptoms alone do not prove a cause.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 font-mono text-[9px] text-slate-500">
                <span>{discoveredClues.length} CLUES COLLECTED</span>
                <span>·</span>
                <span>{selectedEvidenceIds.length} ATTACHED TO CLAIM</span>
                <span>·</span>
                <span>
                  {lookupsUsed}/{lookupLimit} LOOKUPS
                </span>
              </div>
            </section>
            <EvidenceWall
              phase={phase}
              clues={discoveredClues}
              claim={claim}
              evidenceIds={selectedEvidenceIds}
              diagnosisSubmitted={diagnosisSubmitted}
              onClaimChange={updateClaim}
              onEvidenceToggle={toggleEvidence}
              onContinue={() => navigatePhase('fix')}
              onCheckDiagnosis={submitDiagnosis}
            />
          </div>
        )}

        {phase === 'fix' && (
          <div className="space-y-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,0.7fr)_minmax(320px,1.3fr)]">
              <section className="rounded-2xl border border-amber-400/20 bg-amber-400/[0.035] p-4 sm:p-5">
                <p className="font-mono text-[10px] tracking-wider text-amber-200">
                  CHANGE WINDOW · 3 TICKETS
                </p>
                <h2 className="mt-2 flex items-center gap-1 text-xl font-bold text-white">
                  Choose the blast radius.
                  <HelpTip label="About choosing production changes">
                    Choose changes that address the root cause, not just the visible symptom. Each
                    ticket uses part of your limited change budget and can introduce side effects.
                  </HelpTip>
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  The evidence is in. Pick up to three changes, watch for second-order effects, then
                  replay the same traffic in both universes.
                </p>
                <p className="mt-4 flex items-center gap-2 font-mono text-[10px] text-slate-500">
                  <ArrowDown aria-hidden="true" size={12} /> Action time and cost count toward
                  recovery.
                </p>
              </section>
              <EvidenceWall
                phase={phase}
                clues={discoveredClues}
                claim={claim}
                evidenceIds={selectedEvidenceIds}
                diagnosisSubmitted={diagnosisSubmitted}
                onClaimChange={updateClaim}
                onEvidenceToggle={toggleEvidence}
                onContinue={() => navigatePhase('fix')}
                onCheckDiagnosis={submitDiagnosis}
              />
            </div>
            <ActionPalette
              phase={phase}
              selectedIds={selectedActionIds}
              tickets={ticketsUsed}
              costUsd={totalCost}
              maxTickets={scenario.budget.changeTickets}
              maxCostUsd={scenario.budget.maxCostUsd}
              suggestedActionIds={suggestedActionIds}
              onToggleAction={toggleAction}
              onReplay={startReplay}
            />
          </div>
        )}

        {phase === 'postmortem' && resolution && outcome && diagnosis && (
          <PostMortem
            resolution={resolution}
            outcome={outcome}
            diagnosis={diagnosis}
            claim={claim}
            selectedEvidenceIds={selectedEvidenceIds}
            discoveredClues={discoveredClues}
            elapsedSeconds={finalElapsedSeconds}
            lookupsUsed={lookupsUsed}
            ignoredSenior={ignoredSenior}
            hintsUsed={hintLevel}
            codexUnlocked={codexUnlocked}
            onBackToReplay={() => navigatePhase('replay')}
            onUnlockCodex={unlockCodex}
          />
        )}
      </main>
    </div>
  );
}

function PhaseRail({
  phase,
  currentIndex,
  furthestIndex,
  onNavigate,
}: {
  phase: IncidentPhase;
  currentIndex: number;
  furthestIndex: number;
  onNavigate: (phase: IncidentPhase) => void;
}) {
  return (
    <nav
      aria-label="Incident response phases"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70 p-1.5"
    >
      {phases.map((item, index) => {
        const current = item.id === phase;
        const complete = index < currentIndex;
        return (
          <button
            aria-current={current ? 'step' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
              current
                ? 'bg-cyan-500/10 text-cyan-200'
                : complete
                  ? 'text-emerald-300 hover:bg-emerald-400/[0.05]'
                  : 'text-slate-600'
            }`}
            disabled={index > furthestIndex}
            key={item.id}
            onClick={() => onNavigate(item.id)}
            type="button"
          >
            {complete ? (
              <Check aria-hidden="true" size={12} />
            ) : (
              <span className="font-mono text-[9px]">{String(index + 1).padStart(2, '0')}</span>
            )}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function ReplayControls({
  minute,
  playing,
  outcome,
  actionTime,
  recoveryMinutes,
  onMinuteChange,
  onPlay,
  onStep,
  onReset,
  onContinue,
}: {
  minute: number;
  playing: boolean;
  outcome: OutcomeKind;
  actionTime: number;
  recoveryMinutes: number;
  onMinuteChange: (minute: number) => void;
  onPlay: () => void;
  onStep: () => void;
  onReset: () => void;
  onContinue: () => void;
}) {
  const replayComplete = minute >= 20;
  const stamp =
    outcome === 'fixed' && minute >= recoveryMinutes
      ? 'ALL CLEAR'
      : outcome === 'stabilised' && minute >= 20
        ? 'STABILISED'
        : outcome === 'worse' && minute >= 20
          ? 'MADE IT WORSE'
          : outcome === 'unchanged' && minute >= 20
            ? 'NO EFFECT'
            : null;
  const stampColor =
    outcome === 'fixed'
      ? 'text-emerald-300 border-emerald-400/30'
      : outcome === 'stabilised'
        ? 'text-amber-300 border-amber-400/30'
        : 'text-rose-300 border-rose-400/30';

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-wider text-cyan-300">
            PARALLEL-UNIVERSE REPLAY
          </p>
          <h2 className="mt-1 flex items-center gap-1 text-lg font-bold text-white">
            Same traffic. Two outcomes.
            <HelpTip label="About replaying the incident">
              Replay compares your selected changes against no change and an ideal fix under the
              same simulated traffic. Play, pause, or step through the recovery.
            </HelpTip>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={playing ? 'Pause replay' : 'Play replay'}
            className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-300 transition hover:border-cyan-400/40 hover:text-white"
            disabled={replayComplete}
            onClick={onPlay}
            type="button"
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button
            aria-label="Advance replay one minute"
            className="rounded-lg border border-slate-700 px-3 py-2 font-mono text-[10px] text-slate-300 transition hover:border-cyan-400/40"
            disabled={replayComplete}
            onClick={onStep}
            type="button"
          >
            +1 min
          </button>
          <button
            aria-label="Restart replay"
            className="grid size-9 place-items-center rounded-lg border border-slate-700 text-slate-400 transition hover:text-white"
            onClick={onReset}
            type="button"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <ReplayUniverse
          label="NO CHANGE"
          tone="rose"
          summary="The cache wave continues into the database."
        />
        <ReplayUniverse
          label="YOUR FIX"
          tone={outcome === 'fixed' ? 'emerald' : outcome === 'stabilised' ? 'amber' : 'rose'}
          summary={
            outcome === 'fixed'
              ? 'The system recovers as the changes take effect.'
              : outcome === 'stabilised'
                ? 'Pressure drops, but the root trigger remains.'
                : outcome === 'worse'
                  ? 'Side effects increase the blast radius.'
                  : 'The incident continues without meaningful change.'
          }
        />
        <ReplayUniverse
          label="IDEAL FIX"
          tone="cyan"
          summary="TTL jitter + coalescing smooths the expiry wave."
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[10px] text-slate-500">
          REPLAY {String(minute).padStart(2, '0')}:00 / 20:00 · ACTION EFFECT {actionTime} MIN
        </span>
        <label className="flex items-center gap-2 font-mono text-[9px] text-slate-500">
          <span className="sr-only">Replay position</span>
          <input
            className="w-36 accent-cyan-400 sm:w-56"
            max={20}
            min={0}
            onChange={(event) => onMinuteChange(Number(event.target.value))}
            type="range"
            value={minute}
          />
          <span>{stamp ?? (playing ? 'RUNNING' : 'PAUSED')}</span>
        </label>
      </div>
      {stamp && (
        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`mx-auto mt-4 w-fit rotate-[-2deg] rounded-lg border-2 px-5 py-2 font-mono text-lg font-black tracking-[0.18em] ${stampColor}`}
          initial={{ opacity: 0, scale: 1.4, y: -8 }}
          role="status"
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        >
          {stamp}
        </motion.div>
      )}
      {replayComplete && (
        <button
          className="mt-4 w-full rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/50"
          onClick={onContinue}
          type="button"
        >
          Open incident post-mortem{' '}
          <ArrowRight aria-hidden="true" className="ml-1 inline" size={15} />
        </button>
      )}
    </section>
  );
}

function ReplayUniverse({
  label,
  tone,
  summary,
}: {
  label: string;
  tone: 'rose' | 'emerald' | 'amber' | 'cyan';
  summary: string;
}) {
  const colors = {
    rose: 'border-rose-500/25 text-rose-300 bg-rose-500/[0.035]',
    emerald: 'border-emerald-500/25 text-emerald-300 bg-emerald-500/[0.035]',
    amber: 'border-amber-500/25 text-amber-300 bg-amber-500/[0.035]',
    cyan: 'border-cyan-500/25 text-cyan-300 bg-cyan-500/[0.035]',
  };
  return (
    <div className={`relative overflow-hidden rounded-xl border p-3 ${colors[tone]}`}>
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-current opacity-50" />
      <p className="font-mono text-[9px] tracking-wider">{label}</p>
      <div aria-hidden="true" className="my-3 flex items-center gap-1.5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((point) => (
          <span
            className={`h-1.5 flex-1 rounded-full ${point < 5 ? 'bg-current opacity-75' : 'bg-current opacity-20'} ${label === 'YOUR FIX' && tone === 'emerald' && point >= 4 ? 'animate-pulse' : ''}`}
            key={point}
          />
        ))}
      </div>
      <p className="min-h-8 text-[10px] leading-4 text-slate-400">{summary}</p>
    </div>
  );
}
