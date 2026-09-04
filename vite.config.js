import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/CryptoPool-App/",
  plugins: [react()],
  // Production hardening: do not publish source maps that make reverse-engineering easier.
  build: {
    sourcemap: false,
  },
});
