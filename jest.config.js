const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    "^https://deno\\.land/x/morphine@[^/]+/mod\\.ts$": "<rootDir>/__mocks__/morphine.ts",
    "^https://esm\\.sh/openai@[^/]+": "<rootDir>/__mocks__/openai.ts",
    "^https://esm\\.sh/@supabase/supabase-js@[^/]+": "<rootDir>/__mocks__/supabase.ts",
    "^https://deno\\.land/x/grammy@[^/]+/mod\\.ts$": "<rootDir>/__mocks__/grammy.ts",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  setupFiles: ["<rootDir>/jest.setup.js"]
};