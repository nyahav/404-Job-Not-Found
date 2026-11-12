import ShowcaseCard from './ShowcaseCard';
import { createArticleCards, type ArticleSummary } from './articleCards';

interface ArticleBentoProps {
  articles: ArticleSummary[];
  basePath: string;
}

export default function ArticleBento({ articles, basePath }: ArticleBentoProps) {
  const cards = createArticleCards(articles, 3);

  return (
    <div className="feature-grid feature-grid--articles" dir="rtl">
      {cards.map((item, index) => (
        <ShowcaseCard basePath={basePath} index={index} item={item} key={item.id} />
      ))}
    </div>
  );
}
