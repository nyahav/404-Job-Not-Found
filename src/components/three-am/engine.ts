import { actionOverrides, actionPalette, scenario } from './scenario';
import type {
  ActionDefinition,
  ActionResolution,
  Claim,
  Clue,
  DiagnosisGrade,
  OutcomeKind,
  Scores,
  ToolId,
} from './types';

export function getAvailableClues(
  clues: Clue[],
  discoveredIds: string[],
  scrubMinute: number,
  tool?: ToolId,
): Clue[] {
  const found = new Set(discoveredIds);
  return clues.filter((clue) => {
    if (found.has(clue.id) || (tool && clue.tool !== tool)) return false;
    if (clue.requires?.some((requiredId) => !found.has(requiredId))) return false;
    if (clue.earliestMinute !== undefined && scrubMinute < clue.earliestMinute) return false;
    if (clue.latestMinute !== undefined && scrubMinute > clue.latestMinute) return false;
    return true;
  });
}

export function validateClaim(claim: Claim, selectedEvidenceIds: string[]): DiagnosisGrade {
  const evidence = scenario.clues.filter((clue) => selectedEvidenceIds.includes(clue.id));
  const supported = evidence.some((clue) => clue.supports?.includes('stampede'));
  const hasRequiredEvidence = scenario.requiredEvidence.every((id) =>
    evidence.some((clue) => clue.id === id && clue.kind === 'signal'),
  );
  const exactClaim =
    claim.trigger === scenario.rootClaim.trigger &&
    claim.mechanism === scenario.rootClaim.mechanism &&
    claim.effect === scenario.rootClaim.effect;

  if (exactClaim && supported && hasRequiredEvidence) return 'exact';
  if (claim.mechanism === scenario.rootClaim.mechanism && (supported || evidence.length === 0)) {
    return 'partial';
  }
  if (
    ['db_saturation', 'api_timeouts', 'queue_backlog'].includes(claim.mechanism) ||
    (evidence.length > 0 && !evidence.some((clue) => clue.kind === 'signal'))
  ) {
    return 'symptom_only';
  }
  return 'wrong';
}

const defaultOverrides: Record<
  string,
  { effect: 'mitigates' | 'worsens' | 'none'; strength: number; explain: string }
> = {
  adds_capacity: {
    effect: 'mitigates',
    strength: 0.3,
    explain: 'Additional capacity absorbs some pressure but does not remove its trigger.',
  },
  offloads_reads: {
    effect: 'mitigates',
    strength: 0.25,
    explain: 'Some reads move away from the primary database, reducing but not removing the burst.',
  },
  spreads_load: {
    effect: 'mitigates',
    strength: 0.35,
    explain: 'Spreading work over time reduces the peak load.',
  },
  reduces_load: {
    effect: 'mitigates',
    strength: 0.3,
    explain: 'This reduces backend load without eliminating synchronized expirations.',
  },
  speeds_queries: {
    effect: 'mitigates',
    strength: 0.25,
    explain: 'Faster queries help the database drain work but the synchronized cache miss remains.',
  },
  sheds_load: {
    effect: 'mitigates',
    strength: 0.25,
    explain: 'Shed traffic lowers backend pressure but rejects some legitimate work.',
  },
  adds_load: {
    effect: 'worsens',
    strength: 0,
    explain: 'This adds work to an already overloaded database.',
  },
  hides_symptoms: {
    effect: 'none',
    strength: 0,
    explain: 'Changing the timeout masks the visible failure but does not reduce database work.',
  },
  reverts_change: {
    effect: 'none',
    strength: 0,
    explain: 'The known deployment is not the trigger for this incident.',
  },
  isolates_failure: {
    effect: 'mitigates',
    strength: 0.15,
    explain:
      'Isolation can limit some downstream pressure but does not spread the cache expiry wave.',
  },
  buffers_load: {
    effect: 'mitigates',
    strength: 0.2,
    explain: 'A queue smooths the incoming burst at the cost of more user-visible latency.',
  },
  clears_state: {
    effect: 'none',
    strength: 0,
    explain: 'Restarting or tuning the service does not change when cache keys expire.',
  },
};

function defaultFor(action: ActionDefinition) {
  for (const tag of action.tags) {
    const fallback = defaultOverrides[tag];
    if (fallback) return fallback;
  }
  return {
    effect: 'none' as const,
    strength: 0,
    explain: 'This action does not materially change this incident.',
  };
}

export function resolveActions(actionIds: string[]): ActionResolution {
  const actions = actionIds
    .map((id) => actionPalette.find((action) => action.id === id))
    .filter((action): action is ActionDefinition => action !== undefined);
  const resolved = actions.map((action) => {
    const override = actionOverrides[action.id];
    const fallback = defaultFor(action);
    const effect = override?.effect ?? fallback.effect;
    return {
      action,
      effect,
      strength: override?.strength ?? fallback.strength,
      sideEffect: override?.sideEffect,
      explain: override?.explain ?? fallback.explain,
    };
  });

  const hasWorseningAction = resolved.some((action) => action.effect === 'worsens');
  const hasFixingCombo =
    actionIds.includes('ttl_jitter') && actionIds.includes('request_coalescing');
  const mitigation = Math.min(
    1,
    resolved.reduce(
      (total, action) => total + (action.effect === 'mitigates' ? action.strength : 0),
      0,
    ),
  );
  let outcome: OutcomeKind = 'unchanged';
  if (hasWorseningAction) outcome = 'worse';
  else if (hasFixingCombo) outcome = 'fixed';
  else if (mitigation > 0.2) outcome = 'stabilised';

  return {
    outcome,
    actions: resolved,
    totalCostUsd: actions.reduce((total, action) => total + action.costUsd, 0),
    timeMin: actions.reduce((slowest, action) => Math.max(slowest, action.timeMin), 0),
    mitigation,
    sideEffects: resolved.flatMap((action) => (action.sideEffect ? [action.sideEffect] : [])),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function metricValueAt(metricId: string, timelineMinute: number): number {
  const metric = scenario.metrics.find((item) => item.id === metricId);
  if (!metric) return 0;
  const minute = clamp(timelineMinute, 0, 90);

  if (metricId === 'cache.hit_rate') {
    if (minute < 60) return metric.baseline;
    if (minute < 64) return metric.baseline - ((metric.baseline - 3) * (minute - 60)) / 4;
    if (minute < 78) return 3 + ((metric.baseline - 3) * (minute - 64)) / 14;
    return metric.baseline;
  }

  if (minute < 60) return metric.baseline;
  const peakAt = metricId === 'api.p99_latency' ? 62 : metricId === 'db.active_conns' ? 66 : 64;
  const recoverAt = 78;
  if (minute < peakAt) {
    const fraction = (minute - 60) / (peakAt - 60);
    return metric.baseline + (metric.peak - metric.baseline) * fraction;
  }
  if (minute < recoverAt) {
    const fraction = (minute - peakAt) / (recoverAt - peakAt);
    return metric.peak - (metric.peak - metric.baseline) * fraction;
  }
  return metric.baseline;
}

export function replayMetricValue(
  metricId: string,
  elapsedMinutes: number,
  outcome: OutcomeKind,
  actionTimeMin: number,
): number {
  const metric = scenario.metrics.find((item) => item.id === metricId);
  if (!metric) return 0;
  const baseline = metric.baseline;
  const incidentValue = metricValueAt(metricId, 65);
  const deviation = incidentValue - baseline;
  const elapsed = clamp(elapsedMinutes, 0, 20);
  const actionEffectStarts = Math.max(0, actionTimeMin);

  if (outcome === 'fixed' && elapsed >= actionEffectStarts) {
    const progress = clamp((elapsed - actionEffectStarts) / 3, 0, 1);
    return incidentValue + (baseline - incidentValue) * progress;
  }
  if (outcome === 'stabilised' && elapsed >= actionEffectStarts) {
    const residual = deviation * 0.35;
    const progress = clamp((elapsed - actionEffectStarts) / 2, 0, 1);
    return incidentValue + (baseline + residual - incidentValue) * progress;
  }
  if (outcome === 'worse' && elapsed >= actionEffectStarts) {
    const progress = clamp((elapsed - actionEffectStarts) / 2, 0, 1);
    return incidentValue + (deviation * 1.5 - deviation) * progress;
  }

  return incidentValue;
}

export function calculateScores(input: {
  elapsedMinutes: number;
  costUsd: number;
  lookupsUsed: number;
  lookupBudget: number;
  selectedEvidenceIds: string[];
  diagnosis: DiagnosisGrade;
  outcome: OutcomeKind;
  sideEffects: string[];
  hintsUsed?: number;
}): Scores {
  const recovery = clamp(
    ((scenario.incidentClockMinutes - input.elapsedMinutes) /
      (scenario.incidentClockMinutes - 12)) *
      100,
    0,
    100,
  );
  const blastRadius = clamp(
    100 -
      input.sideEffects.length * 22 -
      (input.outcome === 'worse' ? 28 : 0) -
      (input.outcome === 'unchanged' ? 12 : 0),
    0,
    100,
  );
  const cost =
    scenario.budget.maxCostUsd === 0
      ? 100
      : clamp(100 - (input.costUsd / scenario.budget.maxCostUsd) * 100, 0, 100);
  const extraLookups = Math.max(0, input.lookupsUsed - 5);
  const selectedClues = scenario.clues.filter((clue) =>
    input.selectedEvidenceIds.includes(clue.id),
  );
  const investigation = clamp(
    100 -
      extraLookups * 10 -
      selectedClues.filter((clue) => clue.kind === 'red_herring').length * 20 -
      (selectedClues.length === 0 || !selectedClues.some((clue) => clue.kind === 'signal')
        ? 20
        : 0) -
      (input.hintsUsed ?? 0) * 8,
    0,
    100,
  );
  const diagnosis = { exact: 100, partial: 60, symptom_only: 30, wrong: 0 }[input.diagnosis];
  const total = Math.round(
    recovery * 0.3 + blastRadius * 0.25 + cost * 0.15 + investigation * 0.15 + diagnosis * 0.15,
  );
  let grade: Scores['grade'] =
    total >= 95 ? 'S' : total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 55 ? 'C' : 'D';
  if (input.diagnosis !== 'exact' && (grade === 'S' || grade === 'A')) grade = 'B';

  return { recovery, blastRadius, cost, investigation, diagnosis, total, grade };
}

export function actionForId(id: string) {
  return actionPalette.find((action) => action.id === id);
}
