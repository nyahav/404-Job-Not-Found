import { motion, useReducedMotion } from 'framer-motion';
import { Activity, ArrowUpRight, Cloud, Database } from 'lucide-react';
import Reveal from './Reveal';
import { MOTION_DURATION, MOTION_EASE } from './motion';

interface FeatureBentoProps {
  basePath: string;
}

const items = [
  {
    href: 'cloud-architect/',
    icon: Cloud,
    eyebrow: '01 / ARCHITECTURE',
    title: 'Cloud Architect',
    description:
      'Explore cloud systems through interactive architecture maps, guides, quizzes, and a design sandbox.',
  },
  {
    href: 'database-explorer/',
    icon: Database,
    eyebrow: '02 / DATA SYSTEMS',
    title: 'Database Explorer',
    description:
      'See how storage engines, concurrency, and query planners behave under production load.',
  },
  {
    href: '3-am/',
    icon: Activity,
    eyebrow: '03 / INCIDENT RESPONSE',
    title: '3 AM incident response',
    description:
      'Investigate a production incident, test mitigations, and learn from the outcome in a playable lab.',
  },
];

export default function FeatureBento({ basePath }: FeatureBentoProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="feature-grid">
      {items.map((item, index) => {
        const Icon = item.icon;
        return (
          <Reveal className="feature-card-reveal" delay={index * 0.06} key={item.href}>
            <motion.a
              className="feature-card"
              href={`${basePath}${item.href}`}
              transition={{ duration: MOTION_DURATION.base, ease: MOTION_EASE }}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            >
              <span aria-hidden="true" className="feature-card__icon">
                <Icon size={22} strokeWidth={1.7} />
              </span>
              <span className="feature-card__eyebrow">{item.eyebrow}</span>
              <h3>{item.title}</h3>
              <p className="feature-card__description">{item.description}</p>
              <ArrowUpRight aria-hidden="true" className="feature-card__arrow" size={20} />
            </motion.a>
          </Reveal>
        );
      })}
    </div>
  );
}
