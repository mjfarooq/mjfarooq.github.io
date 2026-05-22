import { defineConfig } from 'astro/config';

// User/organization GitHub Pages site served at the domain root.
export default defineConfig({
  site: 'https://mjfarooq.github.io',
  base: '/',
  build: { format: 'directory' },
});
