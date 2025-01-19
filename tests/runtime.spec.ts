import { config } from "dotenv";
import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/runtime";

vi.mock("dotenv", () => ({
  config: vi.fn(),
}));

describe("loadEnv runtime helper", () => {
  it("should call dotenv.config with correct params", () => {
    loadEnv();

    expect(config).toHaveBeenCalledWith({
      path: expect.stringContaining(".env"),
      override: false,
    });
  });

  it("should use provided envDir", () => {
    loadEnv({ envDir: "/custom/dir" });

    expect(config).toHaveBeenCalledWith({
      path: expect.stringContaining("\\custom\\dir\\.env"),
      override: false,
    });
  });
});
