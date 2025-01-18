# hono-vite-env

Environment variable validation plugin for Hono + Vite projects. Stop worrying about missing or invalid environment variables across development, testing, and production.

## Quick Start

```ts
import { defineConfig } from "vite";
import { honoEnv } from "hono-vite-env";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  SOMETHING_ELSE: z.string().optional(), // mark things as optional if you do not want them to throw in strict mode
});

export default defineConfig({
  plugins: [
    // Env validation comes first
    honoEnv({
      schema,
      mode: "strict",
      test: {
        defaults: {
          DATABASE_URL: "sqlite::memory:",
          API_KEY: "fake-api-key",
        },
      },
    }),
    // Then your other plugins
  ],
});
```

That's it! The plugin will:

- Validate your environment variables match the schema
- Show helpful error messages when variables are missing or invalid
- Provide type safety throughout your application
- Handle different environments (dev/test/prod) appropriately

## Features

- 🔒 Type-safe environment variables with Zod
- 💥 Fails fast when required variables are missing
- 🧪 Test environment support with defaults
- 🔄 Works seamlessly with @hono/vite-build
- 📝 Detailed error messages for easy debugging

## Options

```ts
interface HonoEnvOptions {
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
```

## Working with tests

For testing, you can provide default values that will only be used in test mode:

```ts
honoEnv({
  schema: z.object({
    DATABASE_URL: z.string().url(),
    API_KEY: z.string(),
  }),
  test: {
    defaults: {
      DATABASE_URL: "sqlite::memory:",
      API_KEY: "test-key",
    },
  },
});
```

### Using with @hono/vite-build

```ts
import { defineConfig } from "vite";
import { honoEnv } from "@hono/vite-env";
import build from "@hono/vite-build/node";

export default defineConfig({
  plugins: [
    honoEnv({
      schema: z.object({
        // your schema
      }),
    }),
    build({
      // options
    }),
  ],
});
```

### License

MIT
