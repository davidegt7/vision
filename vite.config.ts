import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5188,
    strictPort: true,
    // Phone LAN IPs + tunnels (*.trycloudflare.com, *.loca.lt)
    allowedHosts: true,
  },
  preview: {
    host: true,
    port: 5188,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    target: ["es2020", "safari14", "chrome90"],
    cssTarget: ["safari14"],
  },
});
