import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  platform: "browser",
  format: ["esm", "cjs"],
  target: "es2022",
  dts: true,
  attw: {
    level: "error", // exit 1 if type module resolution errors are found
  }, // https://github.com/arethetypeswrong/arethetypeswrong.github.io
});
