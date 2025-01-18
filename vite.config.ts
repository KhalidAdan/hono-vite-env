/// <reference types="vitest" />

import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "vite-env-validate",
      fileName: (format) => `vite-env-validate.${format}.js`,
    },
    rollupOptions: {
      external: ["vite", "zod"],
      output: {
        globals: {
          vite: "vite",
          zod: "zod",
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
    },
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
});
