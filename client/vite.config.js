import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        calendar: path.resolve(__dirname, "calendar.html"),
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
