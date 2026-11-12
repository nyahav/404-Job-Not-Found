import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpLeft, ArrowUpRight } from 'lucide-react';
import Reveal from './Reveal';
import { MOTION_DURATION, MOTION_EASE } from './motion';
import type { ShowcaseCardItem } from './articleCards';

interface ShowcaseCardProps {
  basePath: string;
  index: number;
  item: ShowcaseCardItem;
  size?: 'standard' | 'carousel';
}

export default function ShowcaseCard({
  basePath,
  index,
  item,
  size = 'standard',
}: ShowcaseCardProps) {
  const reduceMotion = useReducedMotion();
  const isArticle = item.layout === 'article';
  const href = item.layout === 'feature' ? `${basePath}${item.href}` : undefined;
  const articleHref =
    item.layout === 'article' && !item.placeholder ? `${basePath}articles/${item.id}/` : undefined;
  const className = [
    'feature-card',
    isArticle && 'feature-card--article',
    isArticle && size === 'carousel' && 'feature-card--carousel',
  ]
    .filter(Boolean)
    .join(' ');
  const transitionStyle =
    item.layout === 'article' && !item.placeholder
      ? { viewTransitionName: `article-card-${item.id}` }
      : undefined;
  const motionProps = {
    className,
    transition: { duration: MOTION_DURATION.base, ease: MOTION_EASE },
    whileHover: reduceMotion ? undefined : { y: -4 },
    whileTap: reduceMotion ? undefined : { scale: 0.99 },
  };

  const content =
    item.layout === 'feature' ? (
      <>
        <span aria-hidden="true" className="feature-card__icon">
          <item.icon size={22} strokeWidth={1.7} />
        </span>
        <span className="feature-card__eyebrow">{item.eyebrow}</span>
        <h3>{item.title}</h3>
        <p className="feature-card__description">{item.description}</p>
        <ArrowUpRight aria-hidden="true" className="feature-card__arrow" size={20} />
      </>
    ) : (
      <>
        <div className="feature-card__article-meta">
          <span className="feature-card__eyebrow">
            {item.placeholder ? 'בקרוב' : `מאמר / ${String(index + 1).padStart(2, '0')}`}
          </span>
          {item.pubDate ? (
            <time dateTime={item.pubDate} dir="ltr">
              {new Date(item.pubDate).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          ) : null}
        </div>
        <span aria-hidden="true" className="feature-card__index">
          {String(index + 1).padStart(2, '0')}
        </span>
        <h3 className="feature-card__article-title" dir="rtl">
          {item.title}
        </h3>
        <p className="feature-card__description" dir="rtl">
          {item.description}
        </p>
        {item.placeholder ? (
          <span className="feature-card__coming-soon">בקרוב</span>
        ) : (
          <ArrowUpLeft aria-hidden="true" className="feature-card__arrow" size={20} />
        )}
      </>
    );

  return (
    <Reveal className="feature-card-reveal" delay={index * 0.06}>
      {href ? (
        <motion.a {...motionProps} href={href}>
          {content}
        </motion.a>
      ) : articleHref ? (
        <motion.a {...motionProps} href={articleHref} style={transitionStyle}>
          {content}
        </motion.a>
      ) : (
        <motion.article {...motionProps}>{content}</motion.article>
      )}
    </Reveal>
  );
}
