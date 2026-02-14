
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tauri 桌面端環境判斷
const isTauri = !!process.env.TAURI_PLATFORM;

export default defineConfig({
  plugins: [react()],
  // Tauri 需要固定端口
  server: {
    port: 3000,
    strictPort: true,
  },
  // 優化生產環境
  build: {
    target: isTauri ? (process.env.TAURI_PLATFORM === 'windows' ? 'chrome105' : 'safari13') : 'esnext',
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  // 避免 Vite 遮蔽 Rust 錯誤
  clearScreen: false,
});
