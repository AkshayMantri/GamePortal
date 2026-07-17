import { defineConfig, envField } from "astro/config";

export default defineConfig({
  output: "static",
  env: {
    schema: {
      PUBLIC_APP_ENV: envField.enum({
        context: "client",
        access: "public",
        values: ["development", "test", "production"],
        default: "development",
      }),
    },
  },
});
