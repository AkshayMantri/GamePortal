import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { parseConfigFileTextToJson } from "typescript";
import { describe, expect, it } from "vitest";

const projectFile = (path: string) => resolve(process.cwd(), path);

describe("static-first foundation", () => {
  it("keeps Wrangler asset-first with only the approved local D1 binding", async () => {
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
      d1_databases: [
        {
          binding: "DB",
          database_name: "game-portal-local",
          migrations_dir: "migrations",
          remote: false,
        },
      ],
    });
    expect(wrangler).not.toHaveProperty("main");
    expect(wrangler).not.toHaveProperty("kv_namespaces");
    expect(wrangler).not.toHaveProperty("r2_buckets");
    expect(wrangler).not.toHaveProperty("services");

    const [database] = wrangler.d1_databases as Record<string, unknown>[];
    expect(database).not.toHaveProperty("database_id");
    expect(database).not.toHaveProperty("preview_database_id");
  });

  it("keeps every repository D1 script explicitly local-only", async () => {
    const packageSource = await readFile(projectFile("package.json"), "utf8");
    const packageDocument = JSON.parse(packageSource) as {
      scripts: Record<string, string>;
    };
    const d1Scripts = Object.entries(packageDocument.scripts).filter(([name]) =>
      name.startsWith("d1:"),
    );

    expect(d1Scripts).toEqual([
      ["d1:migrate:local", "wrangler d1 migrations apply DB --local"],
    ]);
    for (const [, command] of d1Scripts) {
      expect(command).toContain("--local");
      expect(command).not.toContain("--remote");
      expect(command).not.toMatch(/\bd1\s+create\b/);
      expect(command).not.toMatch(/\bdeploy\b/);
      expect(command).not.toMatch(/\blogin\b/);
    }
  });

  it("keeps every documented Wrangler D1 example explicitly local-only", async () => {
    const guide = await readFile(projectFile("docs/d1-local.md"), "utf8");
    const commandExamples = guide
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /\bwrangler d1\b/.test(line));

    expect(commandExamples).toHaveLength(3);
    for (const command of commandExamples) {
      expect(command).toContain("--local");
      expect(command).not.toContain("--remote");
      expect(command).not.toMatch(/\bd1\s+create\b/);
      expect(command).not.toMatch(/\bdeploy\b/);
      expect(command).not.toMatch(/\blogin\b/);
    }
    expect(guide).not.toMatch(/\bdatabase_id\b/);
    expect(guide).not.toMatch(/\bpreview_database_id\b/);
  });

  it("keeps the local D1 baseline free of remote operations, identifiers, and secrets", async () => {
    const sources = await Promise.all(
      [
        "wrangler.jsonc",
        "package.json",
        "migrations/0001_link_health_baseline.sql",
        "docs/d1-local.md",
      ].map((path) => readFile(projectFile(path), "utf8")),
    );
    const baseline = sources.join("\n");

    expect(baseline).not.toContain("--remote");
    expect(baseline).not.toMatch(/\bd1\s+create\b/i);
    expect(baseline).not.toMatch(/\bwrangler\s+(?:deploy|login)\b/i);
    expect(baseline).not.toMatch(/\b(?:database_id|preview_database_id)\b/);
    expect(baseline).not.toMatch(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
    );
    expect(baseline).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
  });

  it("keeps the application shell and route scaffolds free of client hydration directives", async () => {
    const routeNames = [
      "index",
      "find",
      "browse",
      "random",
      "vote",
      "game-nights",
      "popular",
      "library",
      "account",
      "more",
    ];
    const pages = await Promise.all(
      routeNames.map((name) =>
        readFile(projectFile(`src/pages/${name}.astro`), "utf8"),
      ),
    );
    const layout = await readFile(
      projectFile("src/layouts/BaseLayout.astro"),
      "utf8",
    );

    expect(`${pages.join("\n")}\n${layout}`).not.toMatch(
      /client:(?:load|idle|visible|media|only)/,
    );
  });

  it("keeps typography local, swap-safe, and limited to supplied weights", async () => {
    const css = await readFile(projectFile("src/styles/global.css"), "utf8");
    const expectedFonts = [
      "public/fonts/fraunces/Fraunces72pt-Regular.woff2",
      "public/fonts/fraunces/Fraunces72pt-SemiBold.woff2",
      "public/fonts/source-sans-3/SourceSans3-Regular.ttf.woff2",
      "public/fonts/source-sans-3/SourceSans3-Semibold.ttf.woff2",
      "public/fonts/source-sans-3/SourceSans3-Bold.ttf.woff2",
    ];

    await expect(
      Promise.all(expectedFonts.map((path) => readFile(projectFile(path)))),
    ).resolves.toHaveLength(5);
    expect(css.match(/@font-face/g)).toHaveLength(5);
    expect(css.match(/font-display: swap/g)).toHaveLength(5);
    expect(css).not.toMatch(/url\(["']?https?:/);
    expect(css).not.toMatch(/font-weight:\s*(?:[1589]00|[1-9]50)/);
  });
});
