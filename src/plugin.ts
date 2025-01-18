import { loadEnv, type Plugin } from "vite";
import { z } from "zod";
import { EnvValidateOptions } from "./types";

function inferEnvSchema(env: Record<string, string>) {
  let schema: Record<string, z.ZodString> = {};

  for (let key of Object.keys(env)) {
    schema[key] = z.string();
  }

  return z.object(schema);
}

export function env(options: EnvValidateOptions = {}): Plugin {
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
    name: "vite-env-validate",
    enforce: "pre",
    config: () => {
      if (process.env.NODE_ENV === "production") return {};

      let env = loadEnv(process.env.NODE_ENV || "development", envDir, "");
      validateEnv(env);

      let defineEnv: Record<string, string> = {};

      Object.keys(validatedEnv!).forEach((key) => {
        if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
          defineEnv[`process.env.${key}`] = JSON.stringify(validatedEnv![key]);
        }
      });
      return { define: defineEnv };
    },
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
  };
}
