// @ts-check

import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  // Enable React to support React JSX components.
  integrations: [react()],
  
  // Enable server-side rendering for API endpoints
  output: 'server',

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: node({
    mode: 'standalone',
  }),
});