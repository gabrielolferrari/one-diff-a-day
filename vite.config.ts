import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths work under /one-diff-a-day/ on Pages and on a custom domain alike.
  base: './',
  plugins: [react()],
});
