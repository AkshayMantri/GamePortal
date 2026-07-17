import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseConfigFileTextToJson } from "typescript";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) => resolve(process.cwd(), path);

describe("static-first foundation", () => {
  it("keeps Wrangler asset-first and free of remote resource bindings", async () => {
    const source = await readFile(projectFile("wrangler.jsonc"), "utf8");
    const { config, error } = parseConfigFileTextToJson(
      "wrangler.jsonc",
      source,
    );
    expect(error).toBeUndefined();
    const wrangler = config as Record<string, unknown>;

    expect(wrangler).toMatchObject({
      assets: {
        directory: "./dist",
        run_worker_first: false,
      },
    });
    expect(wrangler).not.toHaveProperty("main");
    expect(wrangler).not.toHaveProperty("d1_databases");
    expect(wrangler).not.toHaveProperty("kv_namespaces");
    expect(wrangler).not.toHaveProperty("r2_buckets");
    expect(wrangler).not.toHaveProperty("services");
  });

  it("keeps the landing page free of client hydration directives", async () => {
    const page = await readFile(projectFile("src/pages/index.astro"), "utf8");
    const layout = await readFile(
      projectFile("src/layouts/BaseLayout.astro"),
      "utf8",
    );

    expect(`${page}\n${layout}`).not.toMatch(
      /client:(?:load|idle|visible|media|only)/,
    );
  });
});
