import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // относительные пути, чтобы не было 404 на GitHub Pages
});