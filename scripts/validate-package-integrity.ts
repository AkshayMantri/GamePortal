import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type ManifestEntry = {
  name: string;
  bytes: number;
  sha256: string;
};

type AuthorityManifest = {
  manifest_scope: string;
  files: ManifestEntry[];
};

const projectRoot = resolve(process.cwd());
const manifestName = "PACKAGE_MANIFEST.json";
const sumsName = "SHA256SUMS.txt";
const authorityNames = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "DATA_MODEL.md",
  "DECISION_LOG.md",
  "GAME_TAXONOMY.md",
  "ITERATION_LOG.md",
  "MVP_BACKLOG.md",
  "PLANNING_INDEX.md",
  "PRODUCT.md",
  "REQUIREMENTS.md",
  "SAFETY_AND_PRIVACY.md",
  "UI_DIRECTION.md",
  "UI_SPEC.md",
  "UX_FLOWS.md",
] as const;

function sha256(content: Uint8Array) {
  return createHash("sha256").update(content).digest("hex");
}

function assertRootFileName(name: string) {
  if (!/^[A-Z0-9_]+\.md$/.test(name)) {
    throw new Error(
      `Manifest entry is not an approved root Markdown file: ${name}`,
    );
  }
}

async function main() {
  const manifestBytes = await readFile(resolve(projectRoot, manifestName));
  const manifest = JSON.parse(
    manifestBytes.toString("utf8"),
  ) as AuthorityManifest;

  if (!manifest.manifest_scope?.trim()) {
    throw new Error("PACKAGE_MANIFEST.json must declare manifest_scope.");
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("PACKAGE_MANIFEST.json must list authority files.");
  }
  const manifestNames = manifest.files.map(({ name }) => name).sort();
  const requiredNames = [...authorityNames].sort();
  if (JSON.stringify(manifestNames) !== JSON.stringify(requiredNames)) {
    throw new Error(
      `PACKAGE_MANIFEST.json must list exactly ${requiredNames.join(", ")}.`,
    );
  }

  const expectedHashes = new Map<string, string>();
  for (const entry of manifest.files) {
    assertRootFileName(entry.name);
    if (expectedHashes.has(entry.name)) {
      throw new Error(`Duplicate manifest entry: ${entry.name}`);
    }

    const content = await readFile(resolve(projectRoot, entry.name));
    const actualHash = sha256(content);
    if (content.byteLength !== entry.bytes) {
      throw new Error(
        `${entry.name}: expected ${entry.bytes} bytes, found ${content.byteLength}.`,
      );
    }
    if (actualHash !== entry.sha256) {
      throw new Error(
        `${entry.name}: expected SHA-256 ${entry.sha256}, found ${actualHash}.`,
      );
    }
    expectedHashes.set(entry.name, actualHash);
  }

  expectedHashes.set(manifestName, sha256(manifestBytes));

  const sumsText = await readFile(resolve(projectRoot, sumsName), "utf8");
  const actualSums = new Map<string, string>();
  for (const [index, rawLine] of sumsText.split(/\r?\n/).entries()) {
    if (!rawLine) continue;
    const match = /^([a-f0-9]{64}) {2}([^/\\]+)$/.exec(rawLine);
    if (!match) {
      throw new Error(`${sumsName}:${index + 1}: invalid checksum line.`);
    }
    const [, hash, name] = match;
    if (!hash || !name) {
      throw new Error(`${sumsName}:${index + 1}: incomplete line.`);
    }
    if (actualSums.has(name)) {
      throw new Error(`${sumsName}:${index + 1}: duplicate entry ${name}.`);
    }
    actualSums.set(name, hash);
  }

  const expectedNames = [...expectedHashes.keys()].sort();
  const actualNames = [...actualSums.keys()].sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(
      `${sumsName}: expected exactly ${expectedNames.join(", ")}; found ${actualNames.join(", ")}.`,
    );
  }
  for (const [name, expectedHash] of expectedHashes) {
    if (actualSums.get(name) !== expectedHash) {
      throw new Error(
        `${sumsName}: ${name} does not match the verified SHA-256 ${expectedHash}.`,
      );
    }
  }

  console.log(
    `Authority integrity passed for ${manifest.files.length} documents and ${manifestName}.`,
  );
}

await main();
