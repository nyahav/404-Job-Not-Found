# 404 — Job Not Found

Astro site starter with React islands, MDX articles, and Tailwind CSS. Pushes to
`main` are deployed to GitHub Pages using GitHub Actions.

The Cloud Architect experience at `/cloud-architect/` is a self-contained React
island with interactive AWS maps, architecture guides, quizzes, and a design
sandbox. Its sample projects and quiz questions are bundled from the supplied
Base44 exports; it does not require the Base44 SDK or API.

## Requirements

- Node.js 22.23.4 or newer
- npm

## Development

```sh
npm install
npm run dev
```

Useful checks before pushing:

```sh
npm run check
npm run lint
npm run format:check
npm run build
```

## Project structure

```text
src/
  components/cloud-architect/ Cloud Architect React experience
  components/demos/    React demos rendered as interactive islands
  content/articles/    MDX articles
  layouts/
  pages/               Includes the Hebrew, RTL About page
  styles/
public/
  Yahav-Nir-Resume.pdf
.github/workflows/     GitHub Pages deployment
```

Add articles as `.mdx` files under `src/content/articles/`. The article
collection validates each article's title, publication date, and description.
The Hebrew About page at `/about/` includes a downloadable PDF resume and a link
to LinkedIn.

## GitHub Pages

The site URL and repository base path are configured in `astro.config.mjs`.
In the repository's **Settings → Pages**, select **GitHub Actions** as the
deployment source. The workflow builds and publishes the site on every push to
`main`; it can also be started manually from the Actions tab.

## VS Code

Open the repository in VS Code and install the recommended extensions when
prompted. They include Astro, Tailwind CSS IntelliSense, ESLint, Prettier, Error
Lens, and GitLens.
