import react from "@astrojs/react";
import { defineConfig, envField } from "astro/config";

export default defineConfig({
  output: "static",
  integrations: [react()],
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
