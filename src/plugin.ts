import { loadEnv, type Plugin } from "vite";
import { z } from "zod";
import { HonoEnvOptions } from "./types";

function inferEnvSchema(env: Record<string, string>) {
  let schema: Record<string, z.ZodString> = {};

  for (let key of Object.keys(env)) {
    schema[key] = z.string();
  }

  return z.object(schema);
}

export function env(options: HonoEnvOptions = {}): Plugin {
  let { mode = "strict", envDir = process.cwd() } = options;

  let validatedEnv: Record<string, any> | null = null;
  let schema: z.ZodSchema;

  let validateEnv = (env: Record<string, string>) => {
    if (!schema) schema = options.schema || inferEnvSchema(env);

    try {
      let result = schema.safeParse(env);

      if (!result.success) {
        console.error("\n❌ Environment validation failed:");

        result.error.issues.forEach((issue) => {
          if (issue.code === "invalid_type" && issue.received === "undefined") {
            console.error(`\n  Missing required env var: ${issue.path[0]}`);
          } else {
            console.error(`\n  ${issue.path[0]}: ${issue.message}`);
          }
        });

        if (mode === "strict") throw new Error("Environment validation failed");
      }

      validatedEnv = result.success ? result.data : env;
      return result;
    } catch (error) {
      console.error("\n❌ Environment validation failed:");
      console.error(
        `\n  ${
          error instanceof Error ? error.message : "Unexpected validation error"
        }`
      );
      if (mode === "strict") throw error;
    }
  };

  return {
    name: "hono-vite-env",
    enforce: "pre",
    configResolved: (config) => {
      let env = loadEnv(config.mode, envDir, "");

      if (config.mode === "test" && options.test?.defaults)
        Object.assign(env, options.test.defaults);

      validateEnv(env);
    },
    buildStart: () => {
      let env = loadEnv(process.env.NODE_ENV || "production", envDir, "");
      validateEnv(env);
    },
    resolveId(id) {
      if (id === "virtual:hono-vite-env") {
        return "\0virtual:hono-vite-env";
      }
      return null;
    },
    load(id) {
      if (id === "\0virtual:hono-vite-env") {
        if (!validatedEnv) {
          throw new Error("Environment not yet validated");
        }

        // Just export types for Hono's env()
        return `
          declare module 'hono' {
            interface ContextEnv {
              Bindings: {
                ${Object.keys(validatedEnv)
                  .map((key) => `${key}: string`)
                  .join(",\n                ")}
              }
            }
          }
          
          // Export type for explicit typing if needed
          export type HonoEnv = {
            ${Object.keys(validatedEnv)
              .map((key) => `${key}: string`)
              .join(",\n            ")}
          }
        `;
      }
      return null;
    },
  };
}
