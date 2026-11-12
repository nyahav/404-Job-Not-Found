export interface ArticleSummary {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
}

export interface ArticleCardItem {
  layout: 'article';
  id: string;
  title: string;
  description: string;
  pubDate?: string;
  placeholder: boolean;
}

export interface FeatureCardItem {
  layout: 'feature';
  href: string;
  icon: typeof import('lucide-react').Cloud;
  eyebrow: string;
  title: string;
  description: string;
}

export type ShowcaseCardItem = ArticleCardItem | FeatureCardItem;

export function createArticleCards(
  articles: ArticleSummary[],
  count = Math.max(3, articles.length),
) {
  const cards: ArticleCardItem[] = articles.slice(0, count).map((article) => ({
    layout: 'article',
    id: article.slug,
    title: article.title,
    description: article.description,
    pubDate: article.pubDate,
    placeholder: false,
  }));

  while (cards.length < count) {
    cards.push({
      layout: 'article',
      id: `coming-soon-${cards.length + 1}`,
      title: 'מאמר חדש בקרוב',
      description: 'התוכן יופיע כאן בקרוב.',
      placeholder: true,
    });
  }

  return cards;
}
