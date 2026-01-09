import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import compression from "vite-plugin-compression";

export default defineConfig({
  plugins: [
    react(),
    compression({
    algorithm: 'brotliCompress', // 2026年主流推荐使用 Brotli
    ext: '.br',
  }),],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    minify: 'terser', // 默认为 'esbuild'
    rollupOptions: {
      input: {
        calendar: path.resolve(__dirname, "calendar.html"),
      },
    },
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境去除 console
        drop_debugger: true,
      },
    },
  },
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080", // Use IPv4 explicitly to avoid IPv6 issues
        changeOrigin: true,
      },
    },
  },
});
