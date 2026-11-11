export interface PolicyStatement {
  Sid?: string;
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
}

export interface IAMPolicy {
  Version: string;
  Statement: PolicyStatement[];
}

export interface CloudService {
  id: string;
  label: string;
  icon: string;
  color: string;
  x: number;
  y: number;
  why?: {
    title: string;
    text: string;
  };
  iamPolicy?: IAMPolicy;
}

export interface ArchitectureConnection {
  from: string;
  to: string;
  label: string;
}

export interface GuideConcept {
  title: string;
  text: string;
  icon?: string;
  color?: string;
}

export interface GuideTradeoff {
  pro: string;
  con: string;
}

export interface GuideStep {
  id: number;
  title: string;
  icon: string;
  color: string;
  summary: string;
  content: {
    intro: string;
    diagram?: string;
    whyThis?: string;
    code?: string;
    verify?: string;
    concepts?: GuideConcept[];
    tradeoffs?: GuideTradeoff[];
  };
}

export interface ArchitectureProject {
  id: string;
  name: string;
  description: string;
  tags: string[];
  color: string;
  icon: string;
  services: Record<string, CloudService>;
  connections: ArchitectureConnection[];
  guide_steps: GuideStep[];
}

export interface QuizQuestion {
  id: string;
  project_id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  category: 'service_roles' | 'iam_policy' | 'best_practices';
}
