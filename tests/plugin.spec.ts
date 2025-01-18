import { existsSync, rmSync } from "node:fs";
import { join } from "path";
import { build } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { env } from "../src/plugin";

describe("vite-env-validate", () => {
  let mockExit = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);
  let mockConsoleError = vi
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
        env({
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
          env({
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
          env({
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
        env({
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
        env({
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
        env({
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

  it("should handle empty env files", async () => {
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
        env({
          schema: z.object({
            OPTIONAL_VAR: z.string().optional(),
          }),
          envDir: "./tests/mocks/basic-app",
        }),
      ],
    });

    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  describe("zero config behavior", () => {
    it("should infer schema from existing env vars", async () => {
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
          env({
            envDir: "./tests/mocks/basic-app",
          }),
        ],
      });

      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(
        existsSync(join("./tests/mocks/basic-app", "dist", "index.js"))
      ).toBe(true);
    });

    it("should handle type coercion in inferred schema", async () => {
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
          env({
            envDir: "./tests/mocks/basic-app",
          }),
        ],
      });

      expect(mockConsoleError).not.toHaveBeenCalled();
    });

    it("should work with minimal config", async () => {
      await build({
        root: "./tests/mocks/basic-app",
        build: {
          ssr: true,
          rollupOptions: {
            input: join("./tests/mocks/basic-app", "src", "index.ts"),
            output: { entryFileNames: "index.js" },
          },
        },
        plugins: [env()],
      });

      expect(mockConsoleError).not.toHaveBeenCalled();
      expect(
        existsSync(join("./tests/mocks/basic-app", "dist", "index.js"))
      ).toBe(true);
    });
  });

  describe("unexpected errors", () => {
    it("should handle invalid schema object in strict mode", async () => {
      await expect(
        build({
          root: "./tests/mocks/basic-app",
          build: {
            ssr: true,
            rollupOptions: {
              input: join("./tests/mocks/basic-app", "src", "index.ts"),
              output: { entryFileNames: "index.js" },
            },
          },
          plugins: [
            env({
              // @ts-expect-error - intentionally invalid schema
              schema: { not: "a zod schema" },
              mode: "strict",
            }),
          ],
        })
      ).rejects.toThrow();

      expect(mockConsoleError).toHaveBeenNthCalledWith(
        1,
        "\n❌ Environment validation failed:"
      );
      expect(mockConsoleError).toHaveBeenNthCalledWith(
        2,
        "\n  schema.safeParse is not a function"
      );
    });

    it("should handle invalid envDir path", async () => {
      const plugin = env({
        schema: z.object({
          MUST_EXIST: z.string(),
        }),
        envDir: "./does/not/exist",
        mode: "strict",
      });

      await expect(
        build({
          root: "./tests/mocks/basic-app",
          build: {
            ssr: true,
            rollupOptions: {
              input: join("./tests/mocks/basic-app", "src", "index.ts"),
              output: { entryFileNames: "index.js" },
            },
          },
          plugins: [plugin],
        })
      ).rejects.toThrow("Environment validation failed");

      expect(mockConsoleError).toHaveBeenNthCalledWith(
        1,
        "\n❌ Environment validation failed:"
      );
      expect(mockConsoleError).toHaveBeenNthCalledWith(
        2,
        "\n  Missing required env var: MUST_EXIST"
      );
    });

    it("should handle malformed .env file", async () => {
      const plugin = env({
        schema: z.object({
          MULTIPLE_EQUALS: z
            .string()
            .refine(
              (val) => !val.includes("="),
              "Environment value cannot contain equals sign"
            ),
          QUOTES: z
            .string()
            .refine(
              (val) => !(val.startsWith('"') && !val.endsWith('"')),
              "Unterminated quote in value"
            ),
        }),
        mode: "strict",
      });

      console.log("Process env:", process.env);

      await expect(
        build({
          root: "./tests/mocks/malformed-env-app",
          build: {
            ssr: true,
            rollupOptions: {
              input: join("./tests/mocks/malformed-env-app", "src", "index.ts"),
              output: { entryFileNames: "index.js" },
            },
          },
          plugins: [plugin],
        })
      ).rejects.toThrow("Environment validation failed");

      expect(mockConsoleError).toHaveBeenNthCalledWith(
        1,
        "\n❌ Environment validation failed:"
      );
      expect(mockConsoleError).toHaveBeenNthCalledWith(
        2,
        "\n  Missing required env var: MULTIPLE_EQUALS"
      );
    });

    it("should handle non-string env values in relaxed mode", async () => {
      process.env.SOME_NUMBER = "123";
      process.env.SOME_BOOLEAN = "true";

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
          env({
            schema: z.object({
              SOME_NUMBER: z.number(),
              SOME_BOOLEAN: z.boolean(),
            }),
            mode: "relaxed",
          }),
        ],
      });

      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});
