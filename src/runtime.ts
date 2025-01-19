import { config } from "dotenv";
import { join } from "path";

export function loadEnv(options: { envDir?: string } = {}) {
  const { envDir = process.cwd() } = options;

  config({
    path: join(envDir, ".env"),
    override: false,
  });

  return process.env;
}
