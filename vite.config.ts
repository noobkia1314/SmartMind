
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    // This ensures process.env.API_KEY is available in the browser environment
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
