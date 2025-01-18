import baseConfig from "@hono/eslint-config";

export default {
  ...baseConfig[0],
  ignores: ["dist", "node_modules"],
  rules: {
    semi: ["error", "always"],
    quotes: ["error", "double"],
    "prefer-const": ["off"],
  },
};
