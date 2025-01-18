import { loadEnv, type Plugin } from "vite";
import { HonoEnvOptions } from "./types";

export function honoEnvPlugin(options: HonoEnvOptions): Plugin {
  let { schema, mode = "strict", envDir = process.cwd() } = options;

  let validateEnv = (env: Record<string, any>) => {
    try {
      const result = schema.safeParse(env);

      if (!result.success) {
        console.error("\n❌ Environment validation failed:");
        result.error.issues.forEach((issue) => {
          if (issue.code === "invalid_type" && issue.received === "undefined") {
            // Required field is missing
            console.error(
              `\n  Missing required env var: ${issue.path.join(".")}`
            );
          } else {
            // Other validation errors
            console.error(`\n  ${issue.path.join(".")}: ${issue.message}`);
          }
        });

        if (mode === "strict") {
          process.exit(1);
        }
      }

      return result;
    } catch (error) {
      if (mode === "strict") {
        throw error;
      }
      console.error("Unexpected validation error:", error);
    }
  };

  return {
    name: "hono-vite-env",
    enforce: "pre",
    configResolved: (config) => {
      const env = loadEnv(config.mode, envDir, "");

      if (config.mode === "test" && options.test?.defaults) {
        Object.assign(env, options.test.defaults);
      }
      validateEnv(env);
    },
    buildStart: () => {
      const env = loadEnv(process.env.NODE_ENV || "production", envDir, "");
      validateEnv(env);
    },
  };
}
