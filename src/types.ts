import { z } from "zod";

/**
 * Configuration options for the Hono Vite environment plugin.
 *
 * @example
 * ```typescript
 * import { defineConfig } from 'vite';
 * import { honoEnvPlugin } from '@hono/vite-env';
 * import { z } from 'zod';
 *
 * export default defineConfig({
 *   plugins: [
 *     honoEnvPlugin({
 *       schema: z.object({
 *         API_KEY: z.string(),
 *         DATABASE_URL: z.string().url()
 *       }),
 *       mode: 'strict',
 *       test: {
 *         defaults: {
 *           API_KEY: 'test-key'
 *         }
 *       }
 *     })
 *   ]
 * });
 * ```
 */
export interface EnvValidateOptions {
  /**
   * Zod schema for validating environment variables.
   * Use this to define the shape and validation rules for your environment.
   *
   * @example
   * ```typescript
   * schema: z.object({
   *   API_KEY: z.string(),
   *   PORT: z.coerce.number().min(1000),
   *   DATABASE_URL: z.string().url()
   * })
   * ```
   */
  schema?: z.ZodSchema;

  /**
   * Validation mode for environment variables.
   * - 'strict': Throws an error if validation fails (default)
   * - 'relaxed': Only logs validation errors and continues execution
   *
   * @default "strict"
   */
  mode?: "strict" | "relaxed";

  /**
   * Directory where .env files are located.
   * The plugin will look for environment files (.env, .env.local, etc.) in this directory.
   *
   * @default process.cwd()
   */
  envDir?: string;

  /**
   * Configuration specific to test environments.
   */
  test?: {
    /**
     * Default environment values to use in test mode.
     * These values will override any existing environment variables when running tests.
     *
     * @example
     * ```typescript
     * test: {
     *   defaults: {
     *     API_KEY: 'test-key',
     *     DATABASE_URL: 'sqlite::memory:'
     *   }
     * }
     * ```
     */
    defaults?: Record<string, string>;
  };

  /**
   * Runtime configuration for server-side apps
   */
  runtime?: {
    /**
     * Whether to load .env files at runtime (server-side only)
     * @default false
     */
    loadEnv?: boolean;

    /**
     * Whether to require .env file to exist
     * @default false
     */
    requireEnv?: boolean;
  };
}
