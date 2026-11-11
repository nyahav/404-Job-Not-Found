export type ToolId =
  'metrics' | 'logs' | 'traces' | 'slow-query' | 'deploys' | 'config' | 'topology';
export type ClaimSlot = 'trigger' | 'mechanism' | 'effect';
export type DiagnosisGrade = 'exact' | 'partial' | 'symptom_only' | 'wrong';
export type ActionEffect = 'mitigates' | 'worsens' | 'none';
export type OutcomeKind = 'fixed' | 'stabilised' | 'unchanged' | 'worse';
export type IncidentPhase = 'alert' | 'investigate' | 'diagnose' | 'fix' | 'replay' | 'postmortem';

export interface ClaimOption {
  id: string;
  label: string;
}

export interface Claim {
  trigger: string;
  mechanism: string;
  effect: string;
}

export interface Clue {
  id: string;
  tool: ToolId;
  title: string;
  reveals: string;
  kind: 'signal' | 'symptom' | 'red_herring';
  supports?: string[];
  requires?: string[];
  earliestMinute?: number;
  latestMinute?: number;
}

export interface IncidentScenario {
  id: string;
  title: string;
  difficulty: number;
  brief: string;
  seed: number;
  incidentClockMinutes: number;
  budget: {
    changeTickets: number;
    lookups: number;
    maxCostUsd: number;
  };
  rootClaim: Claim;
  requiredEvidence: string[];
  clues: Clue[];
  claimSlots: Record<ClaimSlot, ClaimOption[]>;
  metrics: MetricDefinition[];
  summary: string;
  whySymptomsMisled: string;
  idealFix: string[];
  rootConcept: string;
  conceptSummary: string;
  conceptSignature: string[];
}

export interface MetricDefinition {
  id: string;
  label: string;
  component: string;
  unit: string;
  baseline: number;
  peak: number;
  healthyDirection: 'low' | 'high';
}

export interface ActionDefinition {
  id: string;
  label: string;
  description: string;
  tags: string[];
  timeMin: number;
  costUsd: number;
}

export interface ActionOverride {
  effect: ActionEffect;
  strength?: number;
  sideEffect?: string;
  explain: string;
}

export interface ResolvedAction {
  action: ActionDefinition;
  effect: ActionEffect;
  strength: number;
  sideEffect?: string;
  explain: string;
}

export interface ActionResolution {
  outcome: OutcomeKind;
  actions: ResolvedAction[];
  totalCostUsd: number;
  timeMin: number;
  mitigation: number;
  sideEffects: string[];
}

export interface Scores {
  recovery: number;
  blastRadius: number;
  cost: number;
  investigation: number;
  diagnosis: number;
  total: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
}

export const TOOL_LABELS: Record<ToolId, string> = {
  metrics: 'Metrics',
  logs: 'Logs',
  traces: 'Traces',
  'slow-query': 'Slow query log',
  deploys: 'Deploy history',
  config: 'Configuration',
  topology: 'Topology notes',
};

export const CLAIM_SLOT_LABELS: Record<ClaimSlot, string> = {
  trigger: 'Trigger',
  mechanism: 'Mechanism',
  effect: 'Effect',
};
