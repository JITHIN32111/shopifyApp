import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path';
// Handle environment values
const host = process.env.VITE_HOST
  ? process.env.VITE_HOST.replace(/https?:\/\//, "")
  : "localhost";

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.VITE_FRONTEND_PORT) || 443,
    clientPort: 443,
  };
}

export default defineConfig({
  plugins: [react()],
    build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
  server: {
    host: "localhost",
    port: parseInt(process.env.VITE_FRONTEND_PORT) || 5173,
    hmr: hmrConfig,
  },
})
