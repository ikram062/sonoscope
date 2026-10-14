import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The Express server (server/) handles /api. Use 127.0.0.1, not localhost:
    // localhost resolves to ::1 first, and another dev server bound only to
    // [::1]:3000 would silently take the requests. Override with API_TARGET.
    proxy: {
      "/api": process.env.API_TARGET ?? "http://127.0.0.1:3000",
    },
  },
});
