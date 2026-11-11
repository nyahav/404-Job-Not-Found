import importedData from '../../data/cloudArchitectData.json';
import type { ArchitectureProject, QuizQuestion } from './types';

export const architectureProjects: ArchitectureProject[] = importedData.projects.map((project) => ({
  ...project,
  services: Object.fromEntries(
    Object.entries(project.services).filter(
      (entry): entry is [string, NonNullable<(typeof entry)[1]>] => entry[1] !== undefined,
    ),
  ),
}));

function normalizeQuizCategory(category: string): QuizQuestion['category'] {
  switch (category) {
    case 'service_roles':
    case 'iam_policy':
    case 'best_practices':
      return category;
    default:
      throw new Error(`Unknown Cloud Architect quiz category: ${category}`);
  }
}

export const quizQuestions: QuizQuestion[] = importedData.questions.map((question) => {
  return { ...question, category: normalizeQuizCategory(question.category) };
});
