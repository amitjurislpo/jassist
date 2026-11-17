import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  { ignores: [".next/**", "node_modules/**", "coverage/**", "dist/**", "next-env.d.ts", "public/**", ".claude/**"] },
  ...next,
  ...nextTs,
  // The static page generator and its data are CommonJS (build.js, site/, src/).
  { files: ["build.js", "site/**/*.js", "src/**/*.js"], languageOptions: { sourceType: "commonjs" }, rules: { "@typescript-eslint/no-require-imports": "off" } },
];

export default config;
