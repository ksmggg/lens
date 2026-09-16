import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://ksmggg.github.io/lens/ — the shell only; data comes from the API.
export default defineConfig({ plugins: [react()], base: "/lens/", build: { target: "es2022" } });
