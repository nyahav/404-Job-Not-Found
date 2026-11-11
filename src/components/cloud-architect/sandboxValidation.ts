import type { ArchitectureProject } from './types';

export interface ValidationResult {
  id: string;
  type: 'pass' | 'fail' | 'warn';
  label: string;
}

interface CanvasNode {
  id: string;
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
}

export function validateArchitecture(
  project: ArchitectureProject,
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): ValidationResult[] {
  const placedIds = new Set(nodes.map((node) => node.id));
  const results: ValidationResult[] = [];

  for (const serviceId of Object.keys(project.services)) {
    results.push({
      id: `place-${serviceId}`,
      type: placedIds.has(serviceId) ? 'pass' : 'fail',
      label: `${serviceId} is placed on the canvas`,
    });
  }

  for (const connection of project.connections) {
    const exists = edges.some((edge) => edge.from === connection.from && edge.to === connection.to);
    results.push({
      id: `connection-${connection.from}-${connection.to}`,
      type: exists ? 'pass' : 'fail',
      label: `${connection.from} → ${connection.to} (${connection.label})`,
    });
  }

  for (const edge of edges) {
    const allowed = project.connections.some(
      (connection) => connection.from === edge.from && connection.to === edge.to,
    );
    if (!allowed) {
      results.push({
        id: `unexpected-${edge.id}`,
        type: 'warn',
        label: `Unexpected connection: ${edge.from} → ${edge.to}`,
      });
    }
  }

  return results;
}
