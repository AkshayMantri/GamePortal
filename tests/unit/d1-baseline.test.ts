import { spawnSync } from "node:child_process";
import { lstat, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const projectRoot = resolve(process.cwd());
const wranglerCli = resolve(
  projectRoot,
  "node_modules/wrangler/wrangler-dist/cli.js",
);
const temporaryDirectoryPrefix = "game-portal-d1-";
const d1TestTimeout = 90_000;
let persistenceDirectory = "";
let persistenceIdentity: { device: number; inode: number } | undefined;

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

type D1JsonBatch = {
  results?: Record<string, unknown>[];
  success?: boolean;
};

function runD1(arguments_: string[]): CommandResult {
  expect(arguments_[0]).toBe("d1");
  expect(arguments_).toContain("--local");
  expect(arguments_).not.toContain("--remote");
  expect(arguments_.slice(0, 2)).not.toEqual(["d1", "create"]);

  const result = spawnSync(process.execPath, [wranglerCli, ...arguments_], {
    cwd: projectRoot,
    encoding: "utf8",
    env: {
      ...process.env,
      CI: "true",
      NO_D1_WARNING: "true",
    },
    timeout: 30_000,
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  };
}

function localArguments(...arguments_: string[]) {
  return ["d1", ...arguments_, "--local", "--persist-to", persistenceDirectory];
}

function expectSuccess(result: CommandResult) {
  expect(
    result.status,
    [result.error?.message, result.stdout, result.stderr]
      .filter(Boolean)
      .join("\n"),
  ).toBe(0);
}

function expectSqlFailure(result: CommandResult, message: RegExp) {
  expect(result.status).not.toBe(0);
  expect(`${result.stdout}\n${result.stderr}`).toMatch(message);
}

function query(sql: string): Record<string, unknown>[] {
  const result = runD1(
    localArguments("execute", "DB", "--command", sql, "--json"),
  );
  expectSuccess(result);
  const batches = JSON.parse(result.stdout) as D1JsonBatch[];
  expect(batches.every((batch) => batch.success !== false)).toBe(true);
  return batches.flatMap((batch) => batch.results ?? []);
}

function execute(sql: string): CommandResult {
  return runD1(localArguments("execute", "DB", "--command", sql, "--json"));
}

beforeAll(async () => {
  const resolvedTemporaryRoot = resolve(tmpdir());
  persistenceDirectory = resolve(
    await mkdtemp(join(resolvedTemporaryRoot, temporaryDirectoryPrefix)),
  );

  expect(dirname(persistenceDirectory)).toBe(resolvedTemporaryRoot);
  expect(basename(persistenceDirectory)).toMatch(
    new RegExp(`^${temporaryDirectoryPrefix}`),
  );
  expect(isAbsolute(persistenceDirectory)).toBe(true);
  const repositoryRelativePath = relative(projectRoot, persistenceDirectory);
  expect(
    repositoryRelativePath === ".." ||
      repositoryRelativePath.startsWith(`..${sep}`) ||
      isAbsolute(repositoryRelativePath),
  ).toBe(true);
  const createdDirectory = await lstat(persistenceDirectory);
  expect(createdDirectory.isDirectory()).toBe(true);
  expect(createdDirectory.isSymbolicLink()).toBe(false);
  persistenceIdentity = {
    device: createdDirectory.dev,
    inode: createdDirectory.ino,
  };

  const firstApply = runD1(localArguments("migrations", "apply", "DB"));
  expectSuccess(firstApply);
  const secondApply = runD1(localArguments("migrations", "apply", "DB"));
  expectSuccess(secondApply);
}, d1TestTimeout);

afterAll(async () => {
  if (!persistenceDirectory) return;

  const resolvedTemporaryRoot = resolve(tmpdir());
  const exactCreatedPath = resolve(persistenceDirectory);
  const isExactTemporaryChild =
    exactCreatedPath === persistenceDirectory &&
    dirname(exactCreatedPath) === resolvedTemporaryRoot &&
    basename(exactCreatedPath).startsWith(temporaryDirectoryPrefix);
  const repositoryRelativePath = relative(projectRoot, exactCreatedPath);
  const isOutsideRepository =
    repositoryRelativePath === ".." ||
    repositoryRelativePath.startsWith(`..${sep}`) ||
    isAbsolute(repositoryRelativePath);
  const currentDirectory = await lstat(exactCreatedPath);
  const isOriginalDirectory =
    persistenceIdentity !== undefined &&
    currentDirectory.dev === persistenceIdentity.device &&
    currentDirectory.ino === persistenceIdentity.inode;
  const isPlainDirectory =
    currentDirectory.isDirectory() && !currentDirectory.isSymbolicLink();

  if (
    !isExactTemporaryChild ||
    !isOutsideRepository ||
    !isOriginalDirectory ||
    !isPlainDirectory
  ) {
    throw new Error(
      `Refusing unsafe D1 test cleanup target: ${exactCreatedPath}`,
    );
  }
  await rm(exactCreatedPath, { recursive: true, force: false });
});

describe("local D1 link-health baseline", () => {
  it(
    "tracks one forward-only migration and the intended schema",
    () => {
      expect(query("SELECT name FROM d1_migrations ORDER BY id;")).toEqual([
        { name: "0001_link_health_baseline.sql" },
      ]);

      const schema = query(
        "SELECT name, type FROM sqlite_schema WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type, name;",
      );
      expect(schema).toEqual(
        expect.arrayContaining([
          { name: "availability_observation", type: "table" },
          { name: "destination_current_status", type: "table" },
          {
            name: "availability_observation_destination_checked_at_idx",
            type: "index",
          },
          { name: "availability_observation_reject_update", type: "trigger" },
          { name: "availability_observation_reject_delete", type: "trigger" },
          { name: "destination_current_status_match_insert", type: "trigger" },
          { name: "destination_current_status_match_update", type: "trigger" },
        ]),
      );
    },
    d1TestTimeout,
  );

  it(
    "stores a valid observation and matching current projection",
    () => {
      expectSuccess(
        execute(
          "INSERT INTO availability_observation (id, destination_id, checked_at, method, http_status, final_url, latency_ms, classification, confidence) VALUES ('obs_valid', 'dest_fixture', '2026-07-17T00:00:00.000Z', 'head', 200, 'https://example.com/play', 42, 'available', 0.95);",
        ),
      );
      expectSuccess(
        execute(
          "INSERT INTO destination_current_status (destination_id, latest_observation_id, updated_at) VALUES ('dest_fixture', 'obs_valid', '2026-07-17T00:00:01.000Z');",
        ),
      );

      expect(
        query(
          "SELECT s.destination_id, o.classification, o.confidence FROM destination_current_status s JOIN availability_observation o ON o.id = s.latest_observation_id;",
        ),
      ).toEqual([
        {
          destination_id: "dest_fixture",
          classification: "available",
          confidence: 0.95,
        },
      ]);
    },
    d1TestTimeout,
  );

  it(
    "rejects unbounded classifications and numeric ranges",
    () => {
      expectSqlFailure(
        execute(
          "INSERT INTO availability_observation (id, destination_id, checked_at, method, classification, confidence) VALUES ('obs_bad_enum', 'dest_fixture', '2026-07-17T00:01:00.000Z', 'probe', 'maybe', 0.5);",
        ),
        /CHECK constraint failed/i,
      );
      expectSqlFailure(
        execute(
          "INSERT INTO availability_observation (id, destination_id, checked_at, method, http_status, latency_ms, classification, confidence) VALUES ('obs_bad_range', 'dest_fixture', '2026-07-17T00:02:00.000Z', 'get', 99, -1, 'error', 1.1);",
        ),
        /CHECK constraint failed/i,
      );
    },
    d1TestTimeout,
  );

  it(
    "rejects secret-bearing, non-HTTPS, and malformed final URLs",
    () => {
      const rejectedUrls = [
        "https://user:pass@example.com/play?token=secret#capability",
        "https://user:pass@example.com/play",
        "https://example.com/play?token=secret",
        "https://example.com/play#capability",
        "http://example.com/play",
        "/relative/path",
        "data:text/plain,secret",
        "https:///missing-host",
        "HTTPS://example.com/play",
      ];

      for (const [index, finalUrl] of rejectedUrls.entries()) {
        expectSqlFailure(
          execute(
            `INSERT INTO availability_observation (id, destination_id, checked_at, method, final_url, classification, confidence) VALUES ('obs_bad_url_${index}', 'dest_fixture', '2026-07-17T00:05:${String(index).padStart(2, "0")}.000Z', 'get', '${finalUrl}', 'error', 1.0);`,
          ),
          /CHECK constraint failed/i,
        );
      }
    },
    d1TestTimeout,
  );

  it(
    "keeps observations append-only",
    () => {
      expectSqlFailure(
        execute(
          "UPDATE availability_observation SET classification = 'unknown' WHERE id = 'obs_valid';",
        ),
        /availability_observation is append-only/i,
      );
      expectSqlFailure(
        execute("DELETE FROM availability_observation WHERE id = 'obs_valid';"),
        /availability_observation is append-only/i,
      );
    },
    d1TestTimeout,
  );

  it(
    "requires a manual reason and rejects a mismatched observation",
    () => {
      expectSqlFailure(
        execute(
          "INSERT INTO destination_current_status (destination_id, manual_classification, updated_at) VALUES ('dest_manual', 'unknown', '2026-07-17T00:03:00.000Z');",
        ),
        /CHECK constraint failed/i,
      );

      expectSuccess(
        execute(
          "INSERT INTO availability_observation (id, destination_id, checked_at, method, classification, confidence) VALUES ('obs_other', 'dest_other', '2026-07-17T00:04:00.000Z', 'manual', 'unknown', 1.0);",
        ),
      );
      expectSqlFailure(
        execute(
          "INSERT INTO destination_current_status (destination_id, latest_observation_id, updated_at) VALUES ('dest_mismatch', 'obs_other', '2026-07-17T00:04:01.000Z');",
        ),
        /latest observation belongs to a different destination/i,
      );
    },
    d1TestTimeout,
  );
});
