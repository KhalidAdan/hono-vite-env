// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "hono-vite-env",
      fileName: (format) => `hono-vite-env.${format}.js`,
    },
    rollupOptions: {
      // External dependencies we don't want to bundle
      external: ["vite", "zod"],
      output: {
        // Global variables to use for externalized deps
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
      insertTypesEntry: true, // Generates index.d.ts
    }),
  ],
});
