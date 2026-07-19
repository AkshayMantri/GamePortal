import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

type ManifestEntry = {
  name: string;
  bytes: number;
  sha256: string;
};

type AuthorityManifest = {
  manifest_scope: string;
  files: ManifestEntry[];
} & Record<string, unknown>;

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

function assertManifestShape(manifest: AuthorityManifest) {
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
  for (const { name } of manifest.files) assertRootFileName(name);
}

async function readManifest() {
  const bytes = await readFile(resolve(projectRoot, manifestName));
  const manifest = JSON.parse(bytes.toString("utf8")) as AuthorityManifest;
  assertManifestShape(manifest);
  return { bytes, manifest };
}

async function calculateAuthorityEntries(): Promise<ManifestEntry[]> {
  return Promise.all(
    authorityNames.map(async (name) => {
      assertRootFileName(name);
      const content = await readFile(resolve(projectRoot, name));
      return {
        name,
        bytes: content.byteLength,
        sha256: sha256(content),
      };
    }),
  );
}

async function validateIntegrity(
  manifestBytes: Uint8Array,
  manifest: AuthorityManifest,
) {
  assertManifestShape(manifest);

  const expectedHashes = new Map<string, string>();
  for (const entry of manifest.files) {
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

async function writeIntegrity() {
  const { manifest } = await readManifest();
  const files = await calculateAuthorityEntries();
  const generatedManifest = { ...manifest, files };
  const manifestText = `${JSON.stringify(generatedManifest, null, 2)}\n`;
  const manifestBytes = Buffer.from(manifestText, "utf8");

  const hashes = new Map(files.map(({ name, sha256 }) => [name, sha256]));
  hashes.set(manifestName, sha256(manifestBytes));
  const sumsText = `${[...hashes]
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([name, hash]) => `${hash}  ${name}`)
    .join("\n")}\n`;

  await writeFile(resolve(projectRoot, manifestName), manifestBytes);
  await writeFile(resolve(projectRoot, sumsName), sumsText, "utf8");

  const written = await readManifest();
  await validateIntegrity(written.bytes, written.manifest);
  console.log(
    `Authority integrity refreshed for ${files.length} documents and ${manifestName}.`,
  );
}

async function main() {
  const arguments_ = process.argv.slice(2);
  if (arguments_.length === 0) {
    const { bytes, manifest } = await readManifest();
    await validateIntegrity(bytes, manifest);
    return;
  }
  if (arguments_.length === 1 && arguments_[0] === "--write") {
    await writeIntegrity();
    return;
  }
  throw new Error(
    "Usage: node scripts/validate-package-integrity.ts [--write]",
  );
}

await main();
