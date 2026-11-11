import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Check,
  CircleHelp,
  Cog,
  Database,
  Inbox,
  Mail,
  Monitor,
  Network,
  Play,
  RotateCcw,
  Server,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ArchitectureConnection, ArchitectureProject, CloudService } from './types';

interface Props {
  project: ArchitectureProject;
}

interface QueueMessage {
  id: string;
  jobId: string;
  type: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  receiveCount: number;
}

interface ActivityLog {
  id: number;
  text: string;
  color: string;
  time: string;
}

const serviceIcons: Record<string, LucideIcon> = {
  AlertTriangle,
  Cog,
  Database,
  Mail,
  Monitor,
  Server,
  Zap,
};

export default function ArchitectureMap({ project }: Props) {
  const [activeConnection, setActiveConnection] = useState<string | null>(null);
  const [activeNodes, setActiveNodes] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<CloudService | null>(null);
  const [messages, setMessages] = useState<QueueMessage[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [running, setRunning] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sequence = useRef(0);
  const queue = Object.values(project.services).find((service) => service.id === 'sqs');

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const addLog = (text: string, color: string) => {
    sequence.current += 1;
    setLogs((current) =>
      [
        ...current,
        { id: sequence.current, text, color, time: new Date().toLocaleTimeString() },
      ].slice(-30),
    );
  };

  const schedule = (callback: () => void, delay: number) => {
    timers.current.push(setTimeout(callback, delay));
  };

  const simulate = (failure = false) => {
    if (running) return;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(true);
    setSelectedService(null);
    setActiveNodes([]);
    setActiveConnection(null);

    const messageId = `job-${Date.now().toString(36)}`;
    if (queue) {
      setQueueOpen(true);
      setMessages([
        {
          id: messageId,
          jobId: `JOB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          type: failure ? 'simulate_failure' : 'process_request',
          status: 'waiting',
          receiveCount: 0,
        },
      ]);
    }

    let flow: ArchitectureConnection[] = project.connections;
    const canDeadLetter = Boolean(
      project.services.api &&
      project.services.sqs &&
      project.services.dlq &&
      project.services.lambda,
    );

    if (failure && canDeadLetter) {
      const desiredFlow = [
        ['client', 'api'],
        ['api', 'sqs'],
        ['sqs', 'dlq'],
        ['dlq', 'lambda'],
        ['lambda', 'dynamodb'],
      ];
      flow = desiredFlow
        .map(([from, to]) =>
          project.connections.find(
            (connection) => connection.from === from && connection.to === to,
          ),
        )
        .filter((connection): connection is ArchitectureConnection => Boolean(connection));
    } else if (failure) {
      flow = project.connections.slice(0, Math.min(3, project.connections.length));
    }

    if (flow.length === 0) {
      addLog('This architecture does not contain any connections to simulate.', '#f59e0b');
      setRunning(false);
      return;
    }

    flow.forEach((connection, index) => {
      schedule(() => {
        const key = `${connection.from}-${connection.to}`;
        const service = project.services[connection.from];
        setActiveConnection(key);
        setActiveNodes([connection.from, connection.to]);

        const failedRoute = failure && canDeadLetter && connection.to === 'dlq';
        addLog(
          failedRoute
            ? 'Three attempts failed. Message moved to the dead-letter queue.'
            : `${connection.label}: ${connection.from} → ${connection.to}`,
          failedRoute ? '#ef4444' : (service?.color ?? project.color),
        );

        if (connection.from === 'api' && connection.to === 'sqs') {
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId ? { ...message, status: 'waiting' } : message,
            ),
          );
        }
        if (connection.from === 'sqs' && connection.to === 'worker') {
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId
                ? { ...message, status: 'processing', receiveCount: 1 }
                : message,
            ),
          );
        }
        if (failedRoute) {
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId
                ? { ...message, status: 'failed', receiveCount: 3 }
                : message,
            ),
          );
        } else if (!failure && connection.from === 'worker' && connection.to === 'dynamodb') {
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId ? { ...message, status: 'completed' } : message,
            ),
          );
        } else if (!failure && !queue && index === flow.length - 1) {
          addLog('Architecture flow complete.', '#22c55e');
        }
      }, index * 700);
    });

    schedule(
      () => {
        if (failure && !canDeadLetter) {
          addLog(
            'Simulated processing failure. This design does not define a dead-letter queue.',
            '#ef4444',
          );
        } else if (failure) {
          addLog('Failure handled by the dead-letter queue and Lambda.', '#22c55e');
        } else if (queue) {
          addLog('Architecture flow complete.', '#22c55e');
          setMessages((current) =>
            current.map((message) =>
              message.id === messageId && message.status !== 'failed'
                ? { ...message, status: 'completed' }
                : message,
            ),
          );
        }
        setActiveNodes([]);
        setActiveConnection(null);
        setRunning(false);
      },
      flow.length * 700 + 450,
    );
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRunning(false);
    setActiveNodes([]);
    setActiveConnection(null);
    setSelectedService(null);
    setMessages([]);
    setLogs([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          Select a service to understand its role and inspect its IAM permissions.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running}
            onClick={() => simulate(false)}
            type="button"
          >
            <Play aria-hidden="true" size={15} /> Send Job
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/5 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={running}
            onClick={() => simulate(true)}
            type="button"
          >
            <AlertTriangle aria-hidden="true" size={15} /> Simulate failure
          </button>
          {queue && (
            <button
              aria-expanded={queueOpen}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/10"
              onClick={() => setQueueOpen((open) => !open)}
              type="button"
            >
              <Inbox aria-hidden="true" size={15} /> SQS Post Box
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white"
            onClick={reset}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={15} /> Reset
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-cyan-400/15 bg-[#07111f]">
        <svg
          aria-label={`${project.name} service architecture diagram`}
          className="block aspect-[47/27] w-full min-w-[760px]"
          role="img"
          viewBox="0 0 940 540"
        >
          <defs>
            <pattern height="20" id={`grid-${project.id}`} patternUnits="userSpaceOnUse" width="20">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#38bdf8" strokeOpacity=".07" />
            </pattern>
            <marker
              id={`arrow-${project.id}`}
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="6"
              refY="3"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#64748b" />
            </marker>
            <marker
              id={`active-arrow-${project.id}`}
              markerHeight="8"
              markerWidth="8"
              orient="auto"
              refX="6"
              refY="3"
            >
              <path d="M0,0 L0,6 L8,3 z" fill="#22d3ee" />
            </marker>
          </defs>

          <rect fill="#07111f" height="540" width="940" />
          <rect fill={`url(#grid-${project.id})`} height="540" width="940" />
          <rect
            fill="none"
            height="510"
            rx="14"
            stroke="#38bdf8"
            strokeDasharray="8 5"
            strokeOpacity=".22"
            width="900"
            x="20"
            y="15"
          />
          <text fill="#f59e0b" fillOpacity=".75" fontFamily="monospace" fontSize="11" x="35" y="36">
            AWS
          </text>
          <text
            fill="#7dd3fc"
            fillOpacity=".4"
            fontFamily="monospace"
            fontSize="10"
            textAnchor="middle"
            x="470"
            y="36"
          >
            AWS REGION · us-east-1
          </text>

          {project.connections.map((connection) => {
            const from = project.services[connection.from];
            const to = project.services[connection.to];
            if (!from || !to) return null;

            const x1 = from.x + 42;
            const y1 = from.y + 42;
            const x2 = to.x + 42;
            const y2 = to.y + 42;
            const bend = x1 + (x2 - x1) / 2;
            const isActive = activeConnection === `${connection.from}-${connection.to}`;

            return (
              <g key={`${connection.from}-${connection.to}`}>
                <path
                  d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  markerEnd={`url(#${isActive ? 'active-arrow' : 'arrow'}-${project.id})`}
                  stroke={isActive ? '#22d3ee' : '#475569'}
                  strokeDasharray={isActive ? 'none' : '5 6'}
                  strokeOpacity={isActive ? 1 : 0.65}
                  strokeWidth={isActive ? 3 : 1.5}
                />
                <text
                  fill={isActive ? '#a5f3fc' : '#94a3b8'}
                  fontFamily="sans-serif"
                  fontSize="10"
                  paintOrder="stroke"
                  stroke="#07111f"
                  strokeWidth="5"
                  textAnchor="middle"
                  x={bend}
                  y={(y1 + y2) / 2 - 7}
                >
                  {connection.label}
                </text>
              </g>
            );
          })}

          {Object.values(project.services).map((service) => {
            const isActive = activeNodes.includes(service.id);
            const isSelected = selectedService?.id === service.id;
            const Icon = serviceIcons[service.icon] ?? Network;

            return (
              <g
                aria-label={`${service.label}${service.iamPolicy ? ', IAM policy available' : ''}`}
                className="cursor-pointer"
                key={service.id}
                onClick={() => setSelectedService(isSelected ? null : service)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedService(isSelected ? null : service);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {isActive && (
                  <circle
                    cx={service.x + 42}
                    cy={service.y + 42}
                    fill="none"
                    r="48"
                    stroke={service.color}
                    strokeOpacity=".55"
                    strokeWidth="2"
                  >
                    <animate
                      attributeName="r"
                      dur="1s"
                      repeatCount="indefinite"
                      values="44;54;44"
                    />
                  </circle>
                )}
                <rect
                  fill={isSelected ? '#10263b' : '#0b1c2d'}
                  height="78"
                  rx="15"
                  stroke={isSelected ? '#67e8f9' : service.color}
                  strokeOpacity={isSelected ? 1 : 0.75}
                  strokeWidth={isSelected ? 2.5 : 1.6}
                  width="154"
                  x={service.x}
                  y={service.y}
                />
                <circle
                  cx={service.x + 25}
                  cy={service.y + 25}
                  fill={`${service.color}20`}
                  r="13"
                />
                <g
                  color={service.color}
                  transform={`translate(${service.x + 14} ${service.y + 14})`}
                >
                  <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
                </g>
                {service.iamPolicy && (
                  <g aria-label="IAM policy">
                    <rect
                      fill="#8b5cf620"
                      height="17"
                      rx="8"
                      width="35"
                      x={service.x + 111}
                      y={service.y + 8}
                    />
                    <text
                      fill="#c4b5fd"
                      fontFamily="sans-serif"
                      fontSize="8"
                      fontWeight="700"
                      textAnchor="middle"
                      x={service.x + 128}
                      y={service.y + 20}
                    >
                      IAM
                    </text>
                  </g>
                )}
                <text
                  fill="#f1f5f9"
                  fontFamily="sans-serif"
                  fontSize="11"
                  fontWeight="700"
                  x={service.x + 14}
                  y={service.y + 53}
                >
                  {service.label.length > 21 ? `${service.label.slice(0, 19)}…` : service.label}
                </text>
                <text
                  fill={service.color}
                  fontFamily="monospace"
                  fontSize="9"
                  x={service.x + 14}
                  y={service.y + 68}
                >
                  {service.id.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <AnimatePresence>
        {selectedService && (
          <ServiceDetails
            onClose={() => setSelectedService(null)}
            project={project}
            service={selectedService}
          />
        )}
      </AnimatePresence>

      {queue && queueOpen && (
        <section
          aria-label="SQS message queue"
          className="overflow-hidden rounded-2xl border border-amber-400/20 bg-slate-900/80"
        >
          <div className="flex items-center justify-between border-b border-amber-400/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <Inbox aria-hidden="true" className="text-amber-300" size={18} />
              <h2 className="font-semibold text-amber-200">SQS Post Box</h2>
              <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200">
                {messages.length} messages
              </span>
            </div>
            <button
              aria-label="Close message queue"
              className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
              onClick={() => setQueueOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={16} />
            </button>
          </div>
          {messages.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">
              Queue is empty. Send a job to watch messages move through the system.
            </p>
          ) : (
            <div className="space-y-3 p-4">
              {messages.map((message) => (
                <div
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-4"
                  key={message.id}
                >
                  <div>
                    <p className="font-mono text-sm text-white">{message.jobId}</p>
                    <p className="mt-1 text-xs text-slate-400">Type: {message.type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">
                      Attempts: {message.receiveCount}/3
                    </span>
                    <StatusBadge status={message.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="border-t border-amber-400/10 bg-amber-400/5 px-5 py-3 text-xs leading-6 text-slate-300">
            Visibility timeout hides a message while a worker is processing it. After repeated
            failures, a redrive policy can route it to a dead-letter queue.
          </p>
        </section>
      )}

      {logs.length > 0 && (
        <section
          aria-label="Simulation activity"
          className="rounded-2xl border border-slate-800 bg-slate-900/60"
        >
          <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">Activity log</h2>
            <button
              className="text-xs text-slate-400 hover:text-white"
              onClick={() => setLogs([])}
              type="button"
            >
              Clear
            </button>
          </div>
          <ul aria-live="polite" className="max-h-52 space-y-2 overflow-auto px-5 py-4">
            {logs.map((log) => (
              <li className="flex gap-3 text-sm" key={log.id}>
                <time className="shrink-0 font-mono text-xs text-slate-500">{log.time}</time>
                <span style={{ color: log.color }}>{log.text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ServiceDetails({
  project,
  service,
  onClose,
}: {
  project: ArchitectureProject;
  service: CloudService;
  onClose: () => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      aria-label={`${service.label} details`}
      className="rounded-2xl border bg-slate-900/80 p-5"
      exit={{ opacity: 0, y: -4 }}
      initial={{ opacity: 0, y: 4 }}
      style={{ borderColor: `${service.color}45` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-slate-400 uppercase">
            Service details
          </p>
          <h2 className="mt-1 text-lg font-semibold" style={{ color: service.color }}>
            {service.why?.title ?? service.label}
          </h2>
        </div>
        <button
          aria-label="Close service details"
          className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      {service.why && <p className="mt-3 leading-7 text-slate-300">{service.why.text}</p>}

      {service.iamPolicy && (
        <details className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/5">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold text-violet-200">
            <Shield aria-hidden="true" size={15} />
            IAM policy · least privilege
          </summary>
          <pre className="max-h-80 overflow-auto border-t border-violet-400/10 p-4 text-xs leading-6 text-slate-200">
            <code dir="ltr">{JSON.stringify(service.iamPolicy, null, 2)}</code>
          </pre>
        </details>
      )}

      {service.iamPolicy && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-6 text-slate-400">
          <CircleHelp aria-hidden="true" className="mt-1 shrink-0 text-violet-300" size={14} />
          This identity policy describes the permissions assigned to this service in the{' '}
          {project.name} architecture.
        </p>
      )}
    </motion.section>
  );
}

function StatusBadge({ status }: { status: QueueMessage['status'] }) {
  const styles: Record<QueueMessage['status'], string> = {
    waiting: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
    processing: 'border-cyan-400/25 bg-cyan-400/10 text-cyan-200',
    completed: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
    failed: 'border-red-400/25 bg-red-400/10 text-red-200',
  };

  const labels: Record<QueueMessage['status'], string> = {
    waiting: 'Waiting',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Dead-lettered',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${styles[status]}`}
    >
      {status === 'completed' && <Check aria-hidden="true" size={12} />}
      {labels[status]}
    </span>
  );
}
