import catalogValue from "../../catalog/catalog.json";
import { buildFindFilterOptions } from "../find/filter-options.ts";
import { validateCatalogValue } from "./validate.ts";

const validation = validateCatalogValue(catalogValue, "catalog/catalog.json");

if (!validation.success) {
  throw new Error(
    `Find option catalog validation failed:\n${validation.issues
      .map(
        (issue) =>
          `${issue.source}:${issue.path.join(".") || "<root>"} ${issue.code}: ${issue.message}`,
      )
      .join("\n")}`,
  );
}

export const findFilterOptions = buildFindFilterOptions(validation.data);
