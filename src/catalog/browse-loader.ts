import catalogValue from "../../catalog/catalog.json";
import { buildBrowseCollection } from "./browse.ts";
import { validateCatalogValue } from "./validate.ts";

const validation = validateCatalogValue(catalogValue, "catalog/catalog.json");

if (!validation.success) {
  throw new Error(
    `Browse catalog validation failed:\n${validation.issues
      .map(
        (issue) =>
          `${issue.source}:${issue.path.join(".") || "<root>"} ${issue.code}: ${issue.message}`,
      )
      .join("\n")}`,
  );
}

export const browseCollection = buildBrowseCollection(validation.data);
