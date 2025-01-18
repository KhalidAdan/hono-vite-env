import { z } from "zod";

export interface HonoEnvOptions {
  // Your Zod schema for validation
  schema: z.ZodSchema;

  // 'strict' (default) - throws on validation errors
  // 'relaxed' - logs errors but continues
  mode?: "strict" | "relaxed";

  // Directory to look for .env files (default: process.cwd())
  envDir?: string;

  // Test environment configuration
  test?: {
    // Default values to use in test mode
    defaults?: Record<string, string>;
  };
}
