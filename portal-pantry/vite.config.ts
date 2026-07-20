import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  base: "/portal-pantry/",

  // Two entries, one deploy:
  //   /portal-pantry/             → the live demo app  (src/app)
  //   /portal-pantry/case-study/  → the case-study page (src/case-study)
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL("./index.html", import.meta.url)),
        "case-study": fileURLToPath(new URL("./case-study/index.html", import.meta.url)),
      },
    },
  },

  server: {
    port: Number(process.env.PORT) || 5173,
  },
});
