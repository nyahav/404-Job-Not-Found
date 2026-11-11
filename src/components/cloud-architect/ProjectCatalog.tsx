import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Network, Sparkles } from 'lucide-react';
import type { ArchitectureProject } from './types';

interface Props {
  projects: ArchitectureProject[];
  questionCounts: Record<string, number>;
  onSelect: (project: ArchitectureProject) => void;
}

export default function ProjectCatalog({ projects, questionCounts, onSelect }: Props) {
  return (
    <>
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 px-6 py-14 text-center sm:px-12 sm:py-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(14,165,233,0.5) 1px, transparent 0)',
            backgroundSize: '32px 32px',
            maskImage: 'linear-gradient(to bottom, black, transparent)',
          }}
        />
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.35 }}
        >
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Network aria-hidden="true" size={26} />
          </span>
          <p className="mt-6 text-sm font-medium tracking-[0.2em] text-cyan-300 uppercase">
            Cloud Architect
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            See how the cloud fits together.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Explore real AWS architectures, follow hands-on deployment guides, test your knowledge,
            and build a system of your own in the sandbox.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            {projects.length} architectures · Interactive maps · Self-paced learning
          </p>
        </motion.div>
      </section>

      <section aria-labelledby="architecture-projects-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium tracking-[0.2em] text-cyan-300 uppercase">
              Choose a learning path
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-tight text-white"
              id="architecture-projects-heading"
            >
              Architecture projects
            </h2>
          </div>
          <p className="text-sm text-slate-400">{projects.length} projects available</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {projects.map((project, index) => {
            const questions = questionCounts[project.id] ?? 0;

            return (
              <motion.button
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl border bg-slate-900/70 p-6 text-left transition hover:-translate-y-0.5 hover:bg-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
                initial={{ opacity: 0, y: 12 }}
                key={project.id}
                onClick={() => onSelect(project)}
                style={{ borderColor: `${project.color}45` }}
                transition={{ delay: index * 0.08 }}
                type="button"
              >
                <span
                  className="mb-5 block h-1 w-14 rounded-full"
                  style={{ background: project.color }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white transition group-hover:text-cyan-200">
                      {project.name}
                    </h3>
                    <p className="mt-3 leading-7 text-slate-300">{project.description}</p>
                  </div>
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl"
                    style={{ background: `${project.color}20`, color: project.color }}
                  >
                    <Network aria-hidden="true" size={20} />
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300"
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Network aria-hidden="true" size={14} />{' '}
                      {Object.keys(project.services).length} services
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen aria-hidden="true" size={14} /> {project.guide_steps.length} guide
                      steps
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles aria-hidden="true" size={14} /> {questions} questions
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 transition group-hover:gap-3">
                    Explore <ArrowRight aria-hidden="true" size={15} />
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </section>
    </>
  );
}
