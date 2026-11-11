import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BookOpen, FlaskConical, Network, Sparkles } from 'lucide-react';
import { useState } from 'react';
import ArchitectureMap from './ArchitectureMap';
import GuideTab from './GuideTab';
import ProjectCatalog from './ProjectCatalog';
import QuizTab from './QuizTab';
import SandboxTab from './SandboxTab';
import { architectureProjects, quizQuestions } from './data';
import type { ArchitectureProject } from './types';

type ViewTab = 'map' | 'guide' | 'quiz' | 'sandbox';

const tabs: { id: ViewTab; label: string; icon: typeof Network }[] = [
  { id: 'map', label: 'Architecture Map', icon: Network },
  { id: 'guide', label: 'Step-by-step Guide', icon: BookOpen },
  { id: 'quiz', label: 'Knowledge Quiz', icon: Sparkles },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical },
];

export default function CloudArchitectApp() {
  const [project, setProject] = useState<ArchitectureProject | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('map');

  const selectProject = (nextProject: ArchitectureProject) => {
    setProject(nextProject);
    setActiveTab('map');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {!project ? (
        <ProjectCatalog
          projects={architectureProjects}
          questionCounts={quizQuestions.reduce<Record<string, number>>((counts, question) => {
            counts[question.project_id] = (counts[question.project_id] ?? 0) + 1;
            return counts;
          }, {})}
          onSelect={selectProject}
        />
      ) : (
        <>
          <div className="space-y-6">
            <button
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-cyan-300"
              onClick={() => setProject(null)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              All architectures
            </button>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-medium tracking-[0.2em] text-cyan-300 uppercase">
                  Cloud architecture lab
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {project.name}
                </h1>
                <p className="mt-3 max-w-3xl leading-7 text-slate-300">{project.description}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-xs text-slate-400">
                <span>{Object.keys(project.services).length} services</span>
                <span aria-hidden="true">·</span>
                <span>{project.guide_steps.length} guide steps</span>
                <span aria-hidden="true">·</span>
                <span>
                  {quizQuestions.filter((question) => question.project_id === project.id).length}{' '}
                  quiz questions
                </span>
              </div>
            </div>
          </div>

          <div
            aria-label="Architecture tools"
            className="flex flex-wrap gap-2 border-b border-slate-800 pb-3"
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;

              return (
                <button
                  aria-selected={active}
                  className={`relative inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? 'bg-cyan-400/10 text-cyan-200'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                  id={`cloud-architect-tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  <Icon aria-hidden="true" size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={`${project.id}-${activeTab}`}
              role="tabpanel"
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'map' && <ArchitectureMap project={project} />}
              {activeTab === 'guide' && <GuideTab project={project} />}
              {activeTab === 'quiz' && <QuizTab project={project} />}
              {activeTab === 'sandbox' && <SandboxTab project={project} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
