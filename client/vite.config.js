import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "../server/dist",
    emptyOutDir: true
  },
  server: {
    proxy: {
      // For API calls during dev (optional)
      "/api": "http://localhost:3000",

      // For Socket.IO (important)
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true
      }
    }
  }
});
