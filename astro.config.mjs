// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://nyahav.github.io',
  base: '/404-Job-Not-Found',
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
