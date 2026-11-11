import { AlertCircle, CheckCircle2, Link2, Play, RotateCcw, Trash2, XCircle } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { DragEvent, PointerEvent } from 'react';
import { validateArchitecture } from './sandboxValidation';
import type { ValidationResult } from './sandboxValidation';
import type { ArchitectureProject, CloudService } from './types';

interface CanvasNode {
  id: string;
  x: number;
  y: number;
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
}

const CANVAS_WIDTH = 940;
const CANVAS_HEIGHT = 540;
const NODE_WIDTH = 154;
const NODE_HEIGHT = 78;

export default function SandboxTab({ project }: { project: ArchitectureProject }) {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult[] | null>(null);
  const [expandedValidation, setExpandedValidation] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
    moved: boolean;
  } | null>(null);

  const services = Object.values(project.services);
  const placedIds = useMemo(() => new Set(nodes.map((node) => node.id)), [nodes]);
  const selectedService = selectedNode ? project.services[selectedNode] : null;

  const invalidate = () => setValidation(null);

  const addNode = (id: string, position?: { x: number; y: number }) => {
    const service = project.services[id];
    if (!service || placedIds.has(id)) return;
    const x = position?.x ?? service.x;
    const y = position?.y ?? service.y;
    setNodes((current) => [...current, { id, x, y }]);
    setSelectedNode(id);
    setConnectingFrom(null);
    invalidate();
  };

  const removeNode = (id: string) => {
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.from !== id && edge.to !== id));
    setSelectedNode(null);
    if (connectingFrom === id) setConnectingFrom(null);
    invalidate();
  };

  const handleDrop = (event: DragEvent<SVGSVGElement>) => {
    event.preventDefault();
    const serviceId = event.dataTransfer.getData('text/plain');
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH - NODE_WIDTH / 2;
    const y = ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT - NODE_HEIGHT / 2;
    addNode(serviceId, {
      x: Math.max(4, Math.min(CANVAS_WIDTH - NODE_WIDTH - 4, x)),
      y: Math.max(48, Math.min(CANVAS_HEIGHT - NODE_HEIGHT - 4, y)),
    });
  };

  const startDrag = (event: PointerEvent<SVGGElement>, node: CanvasNode) => {
    event.preventDefault();
    event.stopPropagation();
    const svg = svgRef.current;
    if (!svg || connectingFrom) return;

    drag.current = {
      id: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      nodeX: node.x,
      nodeY: node.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedNode(node.id);
  };

  const moveNode = (event: PointerEvent<SVGSVGElement>) => {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const svg = svgRef.current;
    if (!svg) return;

    const bounds = svg.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / bounds.width;
    const scaleY = CANVAS_HEIGHT / bounds.height;
    const dx = (event.clientX - currentDrag.startX) * scaleX;
    const dy = (event.clientY - currentDrag.startY) * scaleY;
    if (Math.abs(dx) + Math.abs(dy) > 3) currentDrag.moved = true;
    if (!currentDrag.moved) return;

    setNodes((current) =>
      current.map((node) =>
        node.id === currentDrag.id
          ? {
              ...node,
              x: Math.max(4, Math.min(CANVAS_WIDTH - NODE_WIDTH - 4, currentDrag.nodeX + dx)),
              y: Math.max(48, Math.min(CANVAS_HEIGHT - NODE_HEIGHT - 4, currentDrag.nodeY + dy)),
            }
          : node,
      ),
    );
    invalidate();
  };

  const finishPointer = (event: PointerEvent<SVGSVGElement>) => {
    const currentDrag = drag.current;
    if (currentDrag && currentDrag.pointerId === event.pointerId) {
      drag.current = null;
      if (!currentDrag.moved) selectForConnection(currentDrag.id);
      return;
    }

    if (!connectingFrom) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * CANVAS_WIDTH;
    const y = ((event.clientY - bounds.top) / bounds.height) * CANVAS_HEIGHT;
    const target = nodes.find(
      (node) => x >= node.x && x <= node.x + NODE_WIDTH && y >= node.y && y <= node.y + NODE_HEIGHT,
    );
    if (target) selectForConnection(target.id);
  };

  const selectForConnection = (id: string) => {
    setSelectedNode(id);
    if (!connectingFrom) {
      setConnectingFrom(id);
      return;
    }
    if (connectingFrom === id) {
      setConnectingFrom(null);
      return;
    }

    const exists = edges.some((edge) => edge.from === connectingFrom && edge.to === id);
    if (!exists) {
      setEdges((previous) => [
        ...previous,
        { id: `${connectingFrom}->${id}`, from: connectingFrom, to: id },
      ]);
      invalidate();
    }
    setConnectingFrom(null);
  };

  const handlePaletteDragStart = (event: DragEvent<HTMLButtonElement>, service: CloudService) => {
    event.dataTransfer.setData('text/plain', service.id);
    event.dataTransfer.effectAllowed = 'copy';
  };

  const runValidation = () => {
    setValidation(validateArchitecture(project, nodes, edges));
    setExpandedValidation(true);
  };

  const reset = () => {
    setNodes([]);
    setEdges([]);
    setConnectingFrom(null);
    setSelectedNode(null);
    setSelectedEdge(null);
    setValidation(null);
  };

  const failed = validation?.filter((result) => result.type === 'fail').length ?? 0;
  const warnings = validation?.filter((result) => result.type === 'warn').length ?? 0;
  const passed = validation?.filter((result) => result.type === 'pass').length ?? 0;
  const architectureIsValid = validation !== null && failed === 0 && warnings === 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Architecture sandbox</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">
          Add services, drag them to arrange the diagram, then select two services to connect them.
          Build the expected design and run validation.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_250px]">
        <aside
          aria-label="AWS service palette"
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
        >
          <h3 className="px-2 py-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Service palette
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2 xl:flex-col xl:overflow-visible">
            {services.map((service) => (
              <button
                className="flex min-w-40 shrink-0 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-left text-sm text-slate-200 transition hover:border-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-40 xl:min-w-0"
                draggable={!placedIds.has(service.id)}
                key={service.id}
                onClick={() => addNode(service.id)}
                onDragStart={(event) => handlePaletteDragStart(event, service)}
                title={
                  placedIds.has(service.id) ? 'Already on the canvas' : 'Add or drag to the canvas'
                }
                type="button"
                disabled={placedIds.has(service.id)}
              >
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: service.color }}
                />
                <span className="truncate">{service.label}</span>
              </button>
            ))}
          </div>
          <p className="px-2 pt-2 text-xs leading-5 text-slate-500">
            Select to add at the suggested position, or drag onto the canvas.
          </p>
        </aside>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/50 px-4 py-3">
            <p className="text-sm font-semibold text-white">{project.name}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>{nodes.length} services</span>
              <span>{edges.length} connections</span>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-300 transition hover:bg-white/5 hover:text-white"
                onClick={reset}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={13} /> Reset
              </button>
            </div>
          </div>

          <svg
            aria-label={`${project.name} interactive architecture canvas`}
            className="block aspect-[47/27] w-full min-w-[760px] touch-none"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onPointerMove={moveNode}
            onPointerUp={finishPointer}
            ref={svgRef}
            role="application"
            viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
          >
            <defs>
              <pattern
                height="30"
                id={`sandbox-grid-${project.id}`}
                patternUnits="userSpaceOnUse"
                width="30"
              >
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64748b" strokeOpacity=".12" />
              </pattern>
              <marker
                id={`sandbox-arrow-${project.id}`}
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="6"
                refY="3"
              >
                <path d="M0,0 L0,6 L8,3 z" fill="#38bdf8" />
              </marker>
            </defs>
            <rect
              fill={`url(#sandbox-grid-${project.id})`}
              height={CANVAS_HEIGHT}
              width={CANVAS_WIDTH}
            />

            {services
              .filter((service) => !placedIds.has(service.id))
              .map((service) => (
                <g
                  className="cursor-pointer"
                  key={`placeholder-${service.id}`}
                  onClick={() => addNode(service.id)}
                >
                  <rect
                    fill="none"
                    height={NODE_HEIGHT}
                    rx="12"
                    stroke={service.color}
                    strokeDasharray="5 5"
                    strokeOpacity=".32"
                    width={NODE_WIDTH}
                    x={service.x}
                    y={service.y}
                  />
                  <text
                    fill={service.color}
                    fillOpacity=".55"
                    fontFamily="sans-serif"
                    fontSize="10"
                    textAnchor="middle"
                    x={service.x + NODE_WIDTH / 2}
                    y={service.y + NODE_HEIGHT / 2 + 4}
                  >
                    {service.label}
                  </text>
                </g>
              ))}

            {edges.map((edge) => {
              const from = nodes.find((node) => node.id === edge.from);
              const to = nodes.find((node) => node.id === edge.to);
              if (!from || !to) return null;
              const x1 = from.x + NODE_WIDTH / 2;
              const y1 = from.y + NODE_HEIGHT / 2;
              const x2 = to.x + NODE_WIDTH / 2;
              const y2 = to.y + NODE_HEIGHT / 2;
              const bend = x1 + (x2 - x1) / 2;
              const selected = selectedEdge === edge.id;

              return (
                <g key={edge.id}>
                  <path
                    d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    markerEnd={`url(#sandbox-arrow-${project.id})`}
                    stroke={selected ? '#fb7185' : '#38bdf8'}
                    strokeOpacity=".8"
                    strokeWidth={selected ? 3 : 2}
                  />
                  <path
                    aria-label={`Select connection ${edge.from} to ${edge.to}`}
                    className="cursor-pointer"
                    d={`M ${x1} ${y1} C ${bend} ${y1}, ${bend} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    onClick={() =>
                      setSelectedEdge((current) => (current === edge.id ? null : edge.id))
                    }
                    stroke="transparent"
                    strokeWidth="14"
                  />
                  <text
                    fill="#cbd5e1"
                    fontFamily="monospace"
                    fontSize="10"
                    paintOrder="stroke"
                    stroke="#07111f"
                    strokeWidth="5"
                    textAnchor="middle"
                    x={bend}
                    y={(y1 + y2) / 2 - 7}
                  >
                    {edge.from} → {edge.to}
                  </text>
                </g>
              );
            })}

            {nodes.map((node) => {
              const service = project.services[node.id];
              if (!service) return null;
              const isSelected = selectedNode === node.id;
              const isConnecting = connectingFrom === node.id;

              return (
                <g
                  aria-label={`${service.label}. Drag to move. Click to ${
                    connectingFrom ? 'complete a connection' : 'start a connection'
                  }.`}
                  className="cursor-grab active:cursor-grabbing"
                  key={node.id}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      selectForConnection(node.id);
                    }
                  }}
                  onPointerDown={(event) => startDrag(event, node)}
                  role="button"
                  tabIndex={0}
                >
                  <rect
                    fill={isConnecting ? '#10263b' : '#0b1c2d'}
                    height={NODE_HEIGHT}
                    rx="12"
                    stroke={isSelected ? '#67e8f9' : service.color}
                    strokeOpacity={isSelected ? 1 : 0.8}
                    strokeWidth={isSelected || isConnecting ? 2.5 : 1.5}
                    width={NODE_WIDTH}
                    x={node.x}
                    y={node.y}
                  />
                  <circle cx={node.x + 19} cy={node.y + 21} fill={`${service.color}25`} r="10" />
                  <circle cx={node.x + 19} cy={node.y + 21} fill={service.color} r="4" />
                  <text
                    fill="#f1f5f9"
                    fontFamily="sans-serif"
                    fontSize="11"
                    fontWeight="600"
                    x={node.x + 12}
                    y={node.y + 49}
                  >
                    {service.label.length > 21 ? `${service.label.slice(0, 19)}…` : service.label}
                  </text>
                  {service.iamPolicy && (
                    <text
                      fill="#c4b5fd"
                      fontFamily="sans-serif"
                      fontSize="9"
                      x={node.x + NODE_WIDTH - 34}
                      y={node.y + 24}
                    >
                      IAM
                    </text>
                  )}
                  {isConnecting && (
                    <text
                      fill="#67e8f9"
                      fontFamily="sans-serif"
                      fontSize="9"
                      x={node.x + 12}
                      y={node.y + 65}
                    >
                      Select a destination
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
          {nodes.length === 0 && (
            <p className="px-4 pb-4 text-center text-xs text-slate-500">
              Add services from the palette to start building.
            </p>
          )}
        </div>

        <aside className="space-y-4">
          <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
            <button
              aria-expanded={expandedValidation}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
              onClick={() => setExpandedValidation((expanded) => !expanded)}
              type="button"
            >
              <span className="flex items-center gap-2 font-semibold text-white">
                {architectureIsValid ? (
                  <CheckCircle2 aria-hidden="true" className="text-emerald-300" size={17} />
                ) : validation ? (
                  <AlertCircle aria-hidden="true" className="text-amber-300" size={17} />
                ) : (
                  <Play aria-hidden="true" className="text-cyan-300" size={17} />
                )}
                Validation
              </span>
              {validation && (
                <span className="text-xs text-slate-400">
                  {passed}/{validation.length} passed
                </span>
              )}
            </button>

            {expandedValidation && (
              <div className="space-y-3 border-t border-slate-800 p-4">
                <button
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  onClick={runValidation}
                  type="button"
                >
                  <Play aria-hidden="true" size={15} /> Run validation
                </button>
                {validation && (
                  <>
                    {architectureIsValid && (
                      <p className="rounded-lg bg-emerald-400/10 p-3 text-center text-sm font-semibold text-emerald-200">
                        Architecture is correct!
                      </p>
                    )}
                    <ul className="max-h-72 space-y-1.5 overflow-auto">
                      {validation.map((result) => (
                        <li
                          className={`flex items-start gap-2 rounded-lg p-2 text-xs leading-5 ${
                            result.type === 'pass'
                              ? 'bg-emerald-400/5 text-emerald-100'
                              : result.type === 'fail'
                                ? 'bg-red-400/5 text-red-100'
                                : 'bg-amber-400/5 text-amber-100'
                          }`}
                          key={result.id}
                        >
                          {result.type === 'pass' ? (
                            <CheckCircle2
                              aria-hidden="true"
                              className="mt-0.5 shrink-0"
                              size={13}
                            />
                          ) : result.type === 'fail' ? (
                            <XCircle aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                          ) : (
                            <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                          )}
                          <span>{result.label}</span>
                        </li>
                      ))}
                    </ul>
                    {warnings > 0 && (
                      <p className="text-xs text-amber-200">
                        {warnings} unexpected connections found.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </section>

          {selectedService && (
            <section
              className="rounded-2xl border bg-slate-900/70 p-4"
              style={{ borderColor: `${selectedService.color}40` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedService.label}</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {connectingFrom === selectedService.id
                      ? 'Choose another node to connect from here.'
                      : 'Use this service to create a connection.'}
                  </p>
                </div>
                <button
                  aria-label="Remove service"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
                  onClick={() => removeNode(selectedService.id)}
                  type="button"
                >
                  <Trash2 aria-hidden="true" size={15} />
                </button>
              </div>
            </section>
          )}

          {edges.length > 0 && (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Connections
                </h3>
                <Link2 aria-hidden="true" className="text-slate-500" size={14} />
              </div>
              <ul className="mt-3 space-y-2">
                {edges.map((edge) => (
                  <li
                    className={`flex items-center justify-between gap-2 rounded-lg border p-2 text-xs ${
                      selectedEdge === edge.id
                        ? 'border-red-400/30 bg-red-400/5 text-red-200'
                        : 'border-slate-800 text-slate-300'
                    }`}
                    key={edge.id}
                  >
                    <button
                      className="min-w-0 flex-1 truncate text-left font-mono"
                      onClick={() =>
                        setSelectedEdge((selected) => (selected === edge.id ? null : edge.id))
                      }
                      type="button"
                    >
                      {edge.from} → {edge.to}
                    </button>
                    <button
                      aria-label={`Remove ${edge.from} to ${edge.to} connection`}
                      className="rounded p-1 text-slate-500 hover:bg-red-400/10 hover:text-red-300"
                      onClick={() => {
                        setEdges((current) => current.filter((item) => item.id !== edge.id));
                        setSelectedEdge(null);
                        invalidate();
                      }}
                      type="button"
                    >
                      <Trash2 aria-hidden="true" size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
