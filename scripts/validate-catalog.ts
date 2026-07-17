import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCatalogJson } from "../src/catalog/validate.ts";

const catalogRoot = resolve(process.cwd(), "catalog");
const requestedFiles = process.argv
  .slice(2)
  .filter((argument) => argument !== "--file");
const files =
  requestedFiles.length > 0
    ? requestedFiles.map((file) => resolve(file))
    : await findJsonFiles(catalogRoot);

if (files.length === 0) {
  console.error(
    "Catalog validation failed: no production catalog JSON files were found.",
  );
  process.exitCode = 1;
} else {
  let issueCount = 0;
  for (const file of files) {
    const source = file.replace(`${process.cwd()}\\`, "");
    let input: string;
    try {
      input = await readFile(file, "utf8");
    } catch (error) {
      issueCount += 1;
      console.error(
        `${source}: filesystem: ${error instanceof Error ? error.message : "Unable to read file."}`,
      );
      continue;
    }

    const result = parseCatalogJson(input, source);
    if (!result.success) {
      issueCount += result.issues.length;
      result.issues.forEach((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
        console.error(
          `${issue.source}:${path}: ${issue.code}: ${issue.message}`,
        );
      });
    }
  }

  if (issueCount > 0) {
    console.error(`Catalog validation failed with ${issueCount} issue(s).`);
    process.exitCode = 1;
  } else {
    console.log(`Catalog validation passed for ${files.length} file(s).`);
  }
}

async function findJsonFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) return findJsonFiles(path);
      return entry.isFile() && entry.name.endsWith(".json") ? [path] : [];
    }),
  );
  return nested.flat().sort();
}
