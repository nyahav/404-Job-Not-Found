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
  { id: 'guide', label: 'Guide', icon: BookOpen },
  { id: 'quiz', label: 'Quiz', icon: Sparkles },
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
    <div className="w-full">
      {!project ? (
        <div className="mx-auto max-w-7xl space-y-8 px-6 py-16 sm:py-24">
          <ProjectCatalog
            projects={architectureProjects}
            questionCounts={quizQuestions.reduce<Record<string, number>>((counts, question) => {
              counts[question.project_id] = (counts[question.project_id] ?? 0) + 1;
              return counts;
            }, {})}
            onSelect={selectProject}
          />
        </div>
      ) : (
        <>
          <div className="w-full border-y border-slate-800 bg-slate-900/80">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-cyan-300"
                  onClick={() => setProject(null)}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" size={16} />
                  All Projects
                </button>
                <span aria-hidden="true" className="h-6 border-l border-slate-700" />
                <span className="inline-flex min-w-0 items-center gap-2 font-semibold text-white">
                  <Network aria-hidden="true" className="shrink-0 text-cyan-300" size={18} />
                  <span className="truncate">{project.name}</span>
                </span>
              </div>

              <div
                aria-label="Architecture tools"
                className="flex items-center gap-1 overflow-x-auto"
                role="tablist"
              >
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;

                  return (
                    <button
                      aria-selected={active}
                      className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                        active
                          ? 'bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/20 ring-inset'
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
            </div>
          </div>

          <section className="mx-auto max-w-7xl px-6 py-14 text-center sm:py-20">
            <p className="mx-auto max-w-3xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
              {project.description}
            </p>
          </section>

          <div className="mx-auto max-w-7xl px-6 pb-16">
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
          </div>
        </>
      )}
    </div>
  );
}
