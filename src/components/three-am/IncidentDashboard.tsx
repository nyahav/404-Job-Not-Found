import { Activity, AlertTriangle, ArrowRight, Clock3, DollarSign, UsersRound } from 'lucide-react';
import type { ReactNode } from 'react';
import { metricValueAt, replayMetricValue } from './engine';
import { scenario } from './scenario';
import type { OutcomeKind, ToolId } from './types';

interface Props {
  elapsedSeconds: number;
  scrubMinute: number;
  onScrub: (minute: number) => void;
  onInspect: (tool: ToolId) => void;
  outcome: OutcomeKind | null;
  replayMinute: number;
  actionTimeMin: number;
  incidentActive: boolean;
}

const incidentStartMinute = 65;
const timelineMarkers = [
  { minute: 0, label: 'Bulk load · 11:00', color: 'bg-cyan-400' },
  { minute: 80, label: 'API scaled · 12:20', color: 'bg-amber-400' },
];

export default function IncidentDashboard({
  elapsedSeconds,
  scrubMinute,
  onScrub,
  onInspect,
  outcome,
  replayMinute,
  actionTimeMin,
  incidentActive,
}: Props) {
  const livePressure = outcome
    ? outcome !== 'fixed' || replayMinute < actionTimeMin + 3
    : incidentActive;
  const burnRate = livePressure ? 184 + Math.floor(elapsedSeconds / 30) * 7 : 0;
  const usersAffected = livePressure ? 24800 + Math.floor(elapsedSeconds / 5) * 190 : 0;
  const clockSeconds = elapsedSeconds;

  return (
    <section aria-label="Incident dashboard" className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <HudCard
          label="INCIDENT CLOCK"
          value={formatClock(clockSeconds)}
          detail={outcome === 'fixed' ? 'RECOVERY TIME' : 'TIME SINCE PAGE'}
          icon={<Clock3 size={16} />}
          color="cyan"
          pulse={incidentActive && !outcome}
        />
        <HudCard
          label="BURN RATE"
          value={livePressure ? `$${burnRate.toLocaleString()}/min` : '$0/min'}
          detail="EST. CUSTOMER IMPACT"
          icon={<DollarSign size={16} />}
          color={livePressure ? 'amber' : 'emerald'}
          pulse={livePressure}
        />
        <HudCard
          label="USERS AFFECTED"
          value={livePressure ? usersAffected.toLocaleString() : '0'}
          detail={livePressure ? 'CHECKOUT DEGRADED' : 'ALL CLEAR'}
          icon={<UsersRound size={16} />}
          color={livePressure ? 'rose' : 'emerald'}
          pulse={livePressure}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity aria-hidden="true" className="text-cyan-300" size={16} />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-slate-200">
                LIVE TOPOLOGY
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-500">CHECKOUT · US-EAST-1</span>
          </div>
          <ArchitectureMap
            active={incidentActive && !outcome}
            outcome={outcome}
            recoveryProgress={outcome === 'fixed' ? replayMinute : 0}
            actionTimeMin={actionTimeMin}
            onInspect={onInspect}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 px-4 py-3">
            <span className="font-mono text-[10px] text-slate-500">BLAST RADIUS</span>
            <BlastRing outcome={outcome} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <Activity aria-hidden="true" className="text-cyan-300" size={16} />
              <h2 className="font-mono text-xs font-semibold tracking-wider text-slate-200">
                SYSTEM SIGNALS
              </h2>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {outcome ? 'REPLAY' : formatTimeline(scrubMinute)}
            </span>
          </div>
          {outcome ? (
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              {scenario.metrics.map((metric) => (
                <MetricChart
                  key={metric.id}
                  metricId={metric.id}
                  replayOutcome={outcome}
                  actionTimeMin={actionTimeMin}
                  replayMinute={replayMinute}
                />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 p-3 sm:grid-cols-2">
              {scenario.metrics.map((metric) => (
                <MetricChart
                  key={metric.id}
                  metricId={metric.id}
                  scrubMinute={scrubMinute}
                  onInspect={onInspect}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {!outcome && <TimelineScrubber value={scrubMinute} onChange={onScrub} />}
    </section>
  );
}

function ArchitectureMap({
  active,
  outcome,
  recoveryProgress,
  actionTimeMin,
  onInspect,
}: {
  active: boolean;
  outcome: OutcomeKind | null;
  recoveryProgress: number;
  actionTimeMin: number;
  onInspect: (tool: ToolId) => void;
}) {
  const statusFor = (id: string) => {
    if (outcome === 'fixed') {
      const recoveryOrder = ['db', 'cache', 'api', 'lb'];
      const recoveryStep = recoveryOrder.indexOf(id);
      const recoveryMinute = actionTimeMin + Math.min(recoveryStep + 1, 3);
      if (recoveryProgress < recoveryMinute) return 'amber';
      return 'healthy';
    }
    if (outcome === 'stabilised') {
      if (id === 'db') return 'amber';
      return 'healthy';
    }
    if (outcome === 'unchanged') {
      if (id === 'db' || id === 'api') return 'critical';
      return 'warning';
    }
    if (outcome === 'worse') {
      if (id === 'api' || id === 'db' || id === 'cache') return 'critical';
      return 'warning';
    }
    if (!active) return 'warning';
    if (id === 'db' || id === 'api') return 'critical';
    if (id === 'cache') return 'warning';
    return 'healthy';
  };

  const nodes = [
    { id: 'lb', label: 'Load Balancer', type: 'ALB', x: 90, y: 112, tool: 'topology' as const },
    {
      id: 'api',
      label: 'Checkout API',
      type: '4 INSTANCES',
      x: 285,
      y: 112,
      tool: 'traces' as const,
    },
    {
      id: 'cache',
      label: 'Redis',
      type: 'CACHE · TTL 3600s',
      x: 405,
      y: 55,
      tool: 'metrics' as const,
    },
    {
      id: 'db',
      label: 'Orders DB',
      type: '200 MAX CONNS',
      x: 405,
      y: 155,
      tool: 'slow-query' as const,
    },
  ];
  const edges = [
    { id: 'lb-api', d: 'M150 112 L220 112' },
    { id: 'api-cache', d: 'M350 108 L405 91' },
    { id: 'api-db', d: 'M350 118 L405 191' },
  ];
  const palette = {
    healthy: 'border-emerald-400/40 bg-emerald-400/[0.06] text-emerald-300',
    warning: 'border-amber-400/50 bg-amber-400/[0.08] text-amber-200',
    critical: 'border-rose-400/55 bg-rose-400/[0.08] text-rose-200',
    amber: 'border-amber-400/50 bg-amber-400/[0.08] text-amber-200',
  };
  const nodeToolMap: Record<string, ToolId> = {
    lb: 'topology',
    api: 'traces',
    cache: 'metrics',
    db: 'metrics',
  };

  return (
    <div className="p-3 sm:p-4">
      <div className="mx-auto max-w-[720px] overflow-x-auto">
        <svg
          aria-label="Service dependency map: load balancer to checkout API, then Redis cache and Orders database"
          className="h-[240px] w-full min-w-[560px]"
          role="img"
          viewBox="0 0 600 240"
        >
          <defs>
            <marker
              id="incident-arrow"
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="6"
              refY="3.5"
            >
              <path d="M0 0 L7 3.5 L0 7Z" fill="#475569" />
            </marker>
          </defs>
          {edges.map((edge) => (
            <path
              d={edge.d}
              fill="none"
              key={edge.id}
              markerEnd="url(#incident-arrow)"
              stroke={outcome === 'fixed' ? '#34d399' : '#475569'}
              strokeWidth={outcome === 'worse' ? 5 : 2}
            />
          ))}
          {active &&
            edges.map((edge, index) => (
              <circle fill={index === 2 ? '#fb7185' : '#67e8f9'} key={`particle-${edge.id}`}>
                <animateMotion
                  dur={`${1.6 + index * 0.4}s`}
                  path={edge.d}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          {outcome === 'fixed' &&
            ['lb-api', 'api-cache', 'api-db'].map((edge, index) => (
              <circle fill="#6ee7b7" key={`recovery-${edge}`}>
                <animateMotion
                  begin={`${index * 0.7}s`}
                  dur="1.3s"
                  path={edges.find((item) => item.id === edge)?.d ?? ''}
                  repeatCount="1"
                />
              </circle>
            ))}
          {nodes.map((node) => {
            const status = statusFor(node.id);
            return (
              <foreignObject height="72" key={node.id} width="160" x={node.x} y={node.y}>
                <button
                  className={`flex h-[68px] w-[154px] flex-col justify-center rounded-xl border px-3 text-left transition hover:brightness-125 ${palette[status]} ${status === 'critical' ? 'animate-[pulse_1.7s_ease-in-out_infinite]' : ''}`}
                  onClick={() => onInspect(nodeToolMap[node.id] ?? node.tool)}
                  type="button"
                >
                  <span className="truncate text-xs font-semibold">{node.label}</span>
                  <span className="mt-1 truncate font-mono text-[9px] opacity-70">{node.type}</span>
                  <span className="mt-1 font-mono text-[9px] uppercase">
                    {status === 'healthy'
                      ? '● HEALTHY'
                      : status === 'warning' || status === 'amber'
                        ? '● DEGRADED'
                        : '● SATURATED'}
                  </span>
                </button>
              </foreignObject>
            );
          })}
        </svg>
      </div>
      <p className="flex items-center gap-2 px-1 text-[10px] text-slate-500">
        <ArrowRight aria-hidden="true" size={12} />
        Select a component to inspect related evidence.
      </p>
    </div>
  );
}

function MetricChart({
  metricId,
  scrubMinute,
  onInspect,
  replayOutcome,
  actionTimeMin = 0,
  replayMinute = 0,
}: {
  metricId: string;
  scrubMinute?: number;
  onInspect?: (tool: ToolId) => void;
  replayOutcome?: OutcomeKind;
  actionTimeMin?: number;
  replayMinute?: number;
}) {
  const metric = scenario.metrics.find((item) => item.id === metricId);
  if (!metric) return null;
  const isReplay = replayOutcome !== undefined;
  const baseline = metric.baseline;
  const values = Array.from({ length: isReplay ? 21 : 19 }, (_, index) =>
    isReplay
      ? replayMetricValue(metricId, index, replayOutcome, actionTimeMin)
      : metricValueAt(metricId, index * 5),
  );
  const allValues = [...values, baseline];
  const minValue = Math.min(...allValues) * 0.88;
  const maxValue = Math.max(...allValues) * 1.08 || 1;
  const width = 220;
  const height = 62;
  const point = (value: number, index: number, count: number) => {
    const x = 4 + (index / Math.max(count - 1, 1)) * (width - 8);
    const y = height - 4 - ((value - minValue) / (maxValue - minValue || 1)) * (height - 8);
    return `${x},${y}`;
  };
  const line = values.map((value, index) => point(value, index, values.length)).join(' ');
  const baseY = point(baseline, 0, values.length).split(',')[1] ?? '0';
  const currentValue = isReplay
    ? replayMetricValue(metricId, replayMinute, replayOutcome, actionTimeMin)
    : metricValueAt(metricId, scrubMinute ?? incidentStartMinute);
  const healthy =
    metric.healthyDirection === 'high'
      ? currentValue >= metric.baseline * 0.8
      : currentValue <= metric.baseline * 1.25;
  const color = isReplay
    ? replayOutcome === 'fixed'
      ? '#34d399'
      : replayOutcome === 'stabilised'
        ? '#fbbf24'
        : replayOutcome === 'worse'
          ? '#fb7185'
          : '#94a3b8'
    : healthy
      ? '#34d399'
      : metric.healthyDirection === 'high' && currentValue < metric.baseline * 0.5
        ? '#fb7185'
        : '#fbbf24';

  return (
    <button
      className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/75 p-3 text-left transition hover:border-cyan-400/30"
      onClick={() => onInspect?.('metrics')}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-slate-300">{metric.label}</p>
          <p className="mt-1 font-mono text-[9px] text-slate-600">{metric.component}</p>
        </div>
        <span className="shrink-0 font-mono text-xs" style={{ color }}>
          {formatMetric(currentValue, metric.unit)}
        </span>
      </div>
      <svg
        aria-hidden="true"
        className="mt-2 h-16 w-full"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        <line
          x1="0"
          x2={width}
          y1={baseY}
          y2={baseY}
          stroke="#475569"
          strokeDasharray="3 4"
          strokeWidth="1"
        />
        {!isReplay && (
          <line
            x1={4 + ((scrubMinute ?? incidentStartMinute) / 90) * (width - 8)}
            x2={4 + ((scrubMinute ?? incidentStartMinute) / 90) * (width - 8)}
            y1="0"
            y2={height}
            stroke="#94a3b8"
            strokeDasharray="2 3"
            strokeWidth="1"
          />
        )}
        {isReplay && (
          <polyline
            fill="none"
            points={values
              .map((_, index) =>
                point(metricValueAt(metricId, incidentStartMinute), index, values.length),
              )
              .join(' ')}
            stroke="#475569"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
        )}
        <polyline
          fill="none"
          points={line}
          stroke={color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <circle
          cx={
            point(
              currentValue,
              isReplay ? replayMinute : (scrubMinute ?? incidentStartMinute) / 5,
              values.length,
            ).split(',')[0]
          }
          cy={
            point(
              currentValue,
              isReplay ? replayMinute : (scrubMinute ?? incidentStartMinute) / 5,
              values.length,
            ).split(',')[1]
          }
          fill={color}
          r="3"
        />
      </svg>
      <div className="flex justify-between font-mono text-[9px] text-slate-600">
        <span>{isReplay ? 'NOW' : '11:00'}</span>
        <span>{isReplay ? 'NO FIX / YOUR FIX' : '12:30'}</span>
      </div>
    </button>
  );
}

function TimelineScrubber({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-slate-200">
          <Clock3 aria-hidden="true" className="text-amber-300" size={15} />
          TIME SCRUBBER
        </h2>
        <span className="font-mono text-xs text-cyan-300">{formatTimeline(value)}</span>
      </div>
      <div className="relative mt-5 px-1 pb-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-[9px] flex justify-between"
        >
          {timelineMarkers.map((marker) => (
            <span
              className={`absolute top-0 h-3 w-0.5 ${marker.color}`}
              key={marker.label}
              style={{ left: `${(marker.minute / 90) * 100}%` }}
              title={marker.label}
            />
          ))}
        </div>
        <label className="sr-only" htmlFor="incident-scrubber">
          Scrub incident timeline
        </label>
        <input
          className="relative z-10 h-5 w-full cursor-ew-resize accent-cyan-400"
          id="incident-scrubber"
          max={90}
          min={0}
          onChange={(event) => onChange(Number(event.target.value))}
          step={1}
          type="range"
          value={value}
        />
        <div className="mt-2 flex justify-between font-mono text-[9px] text-slate-600">
          <span>11:00</span>
          <span>12:30</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-800 pt-3">
        {timelineMarkers.map((marker) => (
          <button
            className="inline-flex items-center gap-2 font-mono text-[10px] text-slate-400 transition hover:text-white"
            key={marker.label}
            onClick={() => onChange(marker.minute)}
            type="button"
          >
            <span className={`size-1.5 rounded-full ${marker.color}`} />
            {marker.label}
          </button>
        ))}
        <span className="inline-flex items-center gap-2 font-mono text-[10px] text-slate-500">
          <span className="size-1.5 rounded-full bg-rose-500" />
          Alert · 12:05
        </span>
      </div>
    </section>
  );
}

function HudCard({
  label,
  value,
  detail,
  icon,
  color,
  pulse,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  color: 'cyan' | 'amber' | 'rose' | 'emerald';
  pulse: boolean;
}) {
  const palette = {
    cyan: 'border-cyan-500/20 text-cyan-300',
    amber: 'border-amber-500/20 text-amber-300',
    rose: 'border-rose-500/20 text-rose-300',
    emerald: 'border-emerald-500/20 text-emerald-300',
  };
  return (
    <div className={`rounded-xl border bg-slate-900/70 p-3 sm:p-4 ${palette[color]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9px] tracking-wider text-slate-500 sm:text-[10px]">
          {label}
        </span>
        <span className={pulse ? 'animate-pulse' : ''}>{icon}</span>
      </div>
      <p
        aria-live="polite"
        className={`mt-2 font-mono text-xl font-semibold text-slate-100 sm:text-2xl ${pulse ? 'tabular-nums' : ''}`}
      >
        {value}
      </p>
      <p className="mt-1 font-mono text-[9px] tracking-wide text-slate-600">{detail}</p>
    </div>
  );
}

function BlastRing({ outcome }: { outcome: OutcomeKind | null }) {
  const color =
    outcome === 'fixed'
      ? 'border-emerald-400/70 bg-emerald-400/10 text-emerald-300'
      : outcome === 'stabilised'
        ? 'border-amber-400/70 bg-amber-400/10 text-amber-300'
        : outcome === 'worse'
          ? 'border-rose-400/70 bg-rose-400/10 text-rose-300'
          : 'border-rose-500/50 bg-rose-500/10 text-rose-300';
  return (
    <div
      aria-label={`Blast radius status ${outcome ?? 'critical'}`}
      className="flex items-center gap-2"
    >
      <span
        className={`grid size-8 place-items-center rounded-full border ${color} ${!outcome ? 'animate-pulse' : ''}`}
      >
        <AlertTriangle size={14} />
      </span>
      <span className="font-mono text-[10px] uppercase">
        {outcome === 'fixed'
          ? 'Contained'
          : outcome === 'stabilised'
            ? 'Reduced'
            : outcome === 'worse'
              ? 'Expanding'
              : 'Expanding'}
      </span>
    </div>
  );
}

function formatClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

function formatTimeline(minute: number) {
  const total = 11 * 60 + minute;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatMetric(value: number, unit: string) {
  const formatted =
    value >= 1000
      ? `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
      : value >= 100
        ? Math.round(value).toLocaleString()
        : Number.isInteger(value)
          ? String(value)
          : value.toFixed(1);
  return `${formatted}${unit}`;
}
