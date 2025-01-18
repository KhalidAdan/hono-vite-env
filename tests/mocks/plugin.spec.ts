// tests/plugin.test.ts
import { existsSync, rmSync } from "node:fs";
import { join } from "path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { honoEnvPlugin } from "../../src/plugin";

describe("honoEnvPlugin", () => {
  const mockExit = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);
  const mockConsoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  beforeEach(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    rmSync(join("./tests/mocks/basic-app", "dist"), {
      recursive: true,
      force: true,
    });
  });

  it("should successfully build with valid env vars", async () => {
    await build({
      root: "./tests/mocks/basic-app",
      build: {
        ssr: true,
        rollupOptions: {
          input: join("./tests/mocks/basic-app", "src", "index.ts"),
          output: {
            entryFileNames: "index.js",
          },
        },
      },
      plugins: [
        honoEnvPlugin({
          schema: z.object({
            DATABASE_URL: z.string().url(),
            API_KEY: z.string(),
          }),
          envDir: "./tests/mocks/basic-app",
        }),
      ],
    });

    expect(
      existsSync(join("./tests/mocks/basic-app", "dist", "index.js"))
    ).toBe(true);
    expect(mockExit).not.toHaveBeenCalled();
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it("should fail in strict mode when required vars are missing", async () => {
    await expect(
      build({
        root: "./tests/mocks/missing-env-app",
        build: {
          ssr: true,
          rollupOptions: {
            input: join("./tests/mocks/missing-env-app", "src", "index.ts"),
            output: {
              entryFileNames: "index.js",
            },
          },
        },
        plugins: [
          honoEnvPlugin({
            schema: z.object({
              DATABASE_URL: z.string().url(),
            }),
            envDir: "./tests/mocks/missing-env-app",
          }),
        ],
      })
    ).rejects.toThrow("Environment validation failed");

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("Missing required env var: DATABASE_URL")
    );
  });

  it("should handle invalid env var types", async () => {
    await expect(
      build({
        root: "./tests/mocks/invalid-env-app",
        build: {
          ssr: true,
          rollupOptions: {
            input: join("./tests/mocks/invalid-env-app", "src", "index.ts"),
            output: {
              entryFileNames: "index.js",
            },
          },
        },
        plugins: [
          honoEnvPlugin({
            schema: z.object({
              PORT: z.number(),
            }),
            envDir: "./tests/mocks/invalid-env-app",
          }),
        ],
      })
    ).rejects.toThrow();

    expect(mockConsoleError).toHaveBeenCalledWith(
      expect.stringContaining("PORT")
    );
  });

  it("should not fail in relaxed mode when vars are missing", async () => {
    await build({
      root: "./tests/mocks/missing-env-app",
      build: {
        ssr: true,
        rollupOptions: {
          input: join("./tests/mocks/missing-env-app", "src", "index.ts"),
          output: { entryFileNames: "index.js" },
        },
      },
      plugins: [
        honoEnvPlugin({
          schema: z.object({
            DATABASE_URL: z.string().url(),
          }),
          mode: "relaxed",
          envDir: "./tests/mocks/missing-env-app",
        }),
      ],
    });

    expect(mockConsoleError).toHaveBeenCalled();
    expect(
      existsSync(join("./tests/mocks/missing-env-app", "dist", "index.js"))
    ).toBe(true);
  });

  it("should use test defaults in test mode", async () => {
    await build({
      root: "./tests/mocks/basic-app",
      mode: "test",
      build: {
        ssr: true,
        rollupOptions: {
          input: join("./tests/mocks/basic-app", "src", "index.ts"),
          output: { entryFileNames: "index.js" },
        },
      },
      plugins: [
        honoEnvPlugin({
          schema: z.object({
            DATABASE_URL: z.string().url(),
            API_KEY: z.string(),
          }),
          envDir: "./tests/mocks/basic-app",
          test: {
            defaults: {
              DATABASE_URL: "sqlite://test.db",
              API_KEY: "test-key",
            },
          },
        }),
      ],
    });

    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(
      existsSync(join("./tests/mocks/basic-app", "dist", "index.js"))
    ).toBe(true);
  });

  it("should handle optional fields correctly", async () => {
    await build({
      root: "./tests/mocks/basic-app",
      build: {
        ssr: true,
        rollupOptions: {
          input: join("./tests/mocks/basic-app", "src", "index.ts"),
          output: { entryFileNames: "index.js" },
        },
      },
      plugins: [
        honoEnvPlugin({
          schema: z.object({
            DATABASE_URL: z.string().url(),
            OPTIONAL_KEY: z.string().optional(),
            OPTIONAL_WITH_DEFAULT: z.string().default("fallback"),
          }),
          envDir: "./tests/mocks/basic-app",
        }),
      ],
    });

    expect(mockConsoleError).not.toHaveBeenCalled();
    expect(
      existsSync(join("./tests/mocks/basic-app", "dist", "index.js"))
    ).toBe(true);
  });
});
