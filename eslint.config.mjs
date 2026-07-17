import eslint from "@eslint/js";
import prettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const astroAccessibilityRules =
  astro.configs["flat/jsx-a11y-recommended"].at(-1)?.rules ?? {};

export default [
  {
    ignores: [
      ".astro/**",
      ".wrangler/**",
      "dist/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs["flat/recommended"],
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["src/**/*.{jsx,tsx}"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: jsxA11y.configs.recommended.rules,
  },
  {
    files: ["src/**/*.{jsx,tsx}"],
    ...reactHooks.configs.flat["recommended-latest"],
  },
  {
    files: ["**/*.astro"],
    rules: astroAccessibilityRules,
  },
  prettier,
];
