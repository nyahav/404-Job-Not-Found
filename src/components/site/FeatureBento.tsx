import { Activity, Cloud, Database } from 'lucide-react';
import ShowcaseCard from './ShowcaseCard';
import type { FeatureCardItem } from './articleCards';

interface FeatureBentoProps {
  basePath: string;
}

const items: FeatureCardItem[] = [
  {
    layout: 'feature',
    href: 'cloud-architect/',
    icon: Cloud,
    eyebrow: '01 / ARCHITECTURE',
    title: 'Cloud Architect',
    description:
      'Explore cloud systems through interactive architecture maps, guides, quizzes, and a design sandbox.',
  },
  {
    layout: 'feature',
    href: 'database-explorer/',
    icon: Database,
    eyebrow: '02 / DATA SYSTEMS',
    title: 'Database Explorer',
    description:
      'See how storage engines, concurrency, and query planners behave under production load.',
  },
  {
    layout: 'feature',
    href: '3-am/',
    icon: Activity,
    eyebrow: '03 / INCIDENT RESPONSE',
    title: '3 AM incident response',
    description:
      'Investigate a production incident, test mitigations, and learn from the outcome in a playable lab.',
  },
];

export default function FeatureBento({ basePath }: FeatureBentoProps) {
  return (
    <div className="feature-grid">
      {items.map((item, index) => (
        <ShowcaseCard basePath={basePath} index={index} item={item} key={item.href} />
      ))}
    </div>
  );
}
