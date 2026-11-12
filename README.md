# 404 - Job Not Found

Astro site starter with React islands, MDX articles, and Tailwind CSS. Pushes to
`main` are deployed to GitHub Pages using GitHub Actions.

The Cloud Architect experience at `/cloud-architect/` is a self-contained React
island with interactive AWS maps, architecture guides, quizzes, and a design
sandbox. Its sample projects and quiz questions are bundled from the supplied
Base44 exports; it does not require the Base44 SDK or API.

The Database Explorer at `/database-explorer/` contains interactive lessons for
B-Tree page splits, LSM compaction, WAL recovery, MVCC isolation, and query plans.

The 3 AM incident-response lab at `/3-am/` is a playable, client-side incident
simulation. Its first scenario teaches cache-stampede investigation, diagnosis,
mitigation, replay, and post-mortem scoring without a server or external API.

## Brand color

The logo purple is `#7928CA` (RGB `121, 40, 202`), available as the
`--color-logo` CSS custom property.

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

On Windows, review your working tree, then run `.\scripts\publish-site.ps1` to
build the entire site, stage all non-ignored changes, commit them, and push the
commit to `main`. The script includes modified, deleted, and untracked files,
so make sure everything in the working tree is intended for publication. It
uses Node.js 22.23.4 or newer from `PATH`, or finds a supported Node.js runtime
in the local npm cache. GitHub Actions deploys the site after the push.

```powershell
.\scripts\publish-site.ps1
```

## Project structure

```text
src/
  components/cloud-architect/ Cloud Architect React experience
  components/three-am/ 3 AM incident-response game
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
