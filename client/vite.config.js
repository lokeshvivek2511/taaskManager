import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".csb.app"], // ✅ This line allows all CodeSandbox URLs
    proxy: {
      "/api": {
        target: "https://ncnfjh-5000.csb.app/",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
