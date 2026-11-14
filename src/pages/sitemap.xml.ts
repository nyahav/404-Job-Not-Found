import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

const staticPages = ['', 'about/', 'articles/', 'cloud-architect/', 'database-explorer/', '3-am/'];

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    throw new Error('Configure `site` in astro.config.mjs to generate the sitemap.');
  }

  const basePath = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const siteBase = new URL(basePath, site);
  const articles = await getCollection('articles', ({ data }) => !data.draft);
  const urls: { loc: string; lastmod?: string }[] = [
    ...staticPages.map((path) => ({
      loc: new URL(path, siteBase).toString(),
    })),
    ...articles.map((article) => ({
      loc: new URL(`articles/${article.id.replace(/\.(md|mdx)$/, '')}/`, siteBase).toString(),
      lastmod: article.data.updatedDate.toISOString().slice(0, 10),
    })),
  ];

  const entries = urls
    .map(
      ({ loc, lastmod }) =>
        `  <url><loc>${escapeXml(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
};
