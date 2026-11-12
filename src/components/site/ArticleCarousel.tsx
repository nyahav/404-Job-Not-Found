import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import ShowcaseCard from './ShowcaseCard';
import { createArticleCards, type ArticleSummary } from './articleCards';

interface ArticleCarouselProps {
  articles: ArticleSummary[];
  basePath: string;
}

export default function ArticleCarousel({ articles, basePath }: ArticleCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const cards = createArticleCards(articles);
  const activeCard = cards[activeIndex];

  const move = (offset: number) => {
    setActiveIndex((index) => (index + offset + cards.length) % cards.length);
  };

  return (
    <section
      aria-label="מאמרים"
      aria-roledescription="קרוסלת מאמרים"
      className="articles-carousel"
      dir="rtl"
    >
      <div className="articles-carousel__toolbar">
        <p aria-live="polite" className="articles-carousel__count">
          <span>{String(activeIndex + 1).padStart(2, '0')}</span>
          <span aria-hidden="true"> / </span>
          {String(cards.length).padStart(2, '0')}
        </p>
        <div className="articles-carousel__controls">
          <button
            aria-label="המאמר הקודם"
            className="articles-carousel__button"
            onClick={() => move(-1)}
            type="button"
          >
            <ArrowRight aria-hidden="true" size={20} />
          </button>
          <button
            aria-label="המאמר הבא"
            className="articles-carousel__button"
            onClick={() => move(1)}
            type="button"
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
        </div>
      </div>

      <div aria-live="polite" className="articles-carousel__stage">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="articles-carousel__slide"
            exit={{ opacity: 0, x: reduceMotion ? 0 : -28 }}
            initial={{ opacity: 0, x: reduceMotion ? 0 : 28 }}
            key={activeCard.id}
            transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <ShowcaseCard
              basePath={basePath}
              index={activeIndex}
              item={activeCard}
              size="carousel"
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="articles-carousel__hint">בחרו מאמר לקריאה</p>
    </section>
  );
}
