// tests/plugin.test.ts
import { existsSync, rmSync } from "node:fs";
import { join } from "path";
import { build } from "vite";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { honoEnvPlugin } from "../../src/plugin";

describe("honoEnvPlugin", () => {
  const mockExit = vi
    .spyOn(process, "exit")
    .mockImplementation(() => undefined as never);
  const mockConsoleError = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);
  const TEST_APP_PATH = "./tests/mocks/basic-app";

  beforeAll(() => {
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    rmSync(join(TEST_APP_PATH, "dist"), { recursive: true, force: true });
  });

  it("should successfully build with valid env vars", async () => {
    const envContent = await import("fs").then((fs) =>
      fs.readFileSync(join(TEST_APP_PATH, ".env"), "utf-8")
    );
    console.log("Current env file content:", envContent);

    await build({
      root: TEST_APP_PATH,
      build: {
        ssr: true,
        rollupOptions: {
          input: join(TEST_APP_PATH, "src", "index.ts"),
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
          envDir: TEST_APP_PATH,
        }),
      ],
    });

    expect(existsSync(join(TEST_APP_PATH, "dist", "index.js"))).toBe(true);
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
});
