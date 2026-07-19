import { normalizeBrowseText } from "../catalog/browse.ts";

export function matchesBrowseSearch(
  searchText: string,
  query: string,
): boolean {
  const normalizedQuery = normalizeBrowseText(query);
  if (!normalizedQuery) return true;
  const normalizedSearchText = normalizeBrowseText(searchText);
  return normalizedQuery
    .split(" ")
    .every((term) => normalizedSearchText.includes(term));
}

export function initBrowseSearch(root: ParentNode = document): void {
  const browseRoot = root.querySelector<HTMLElement>("[data-browse-root]");
  const form = browseRoot?.querySelector<HTMLFormElement>(
    "[data-browse-search]",
  );
  const input = form?.querySelector<HTMLInputElement>('input[type="search"]');
  const status = browseRoot?.querySelector<HTMLElement>("[data-browse-status]");
  const empty = browseRoot?.querySelector<HTMLElement>("[data-browse-empty]");
  const games = [
    ...(browseRoot?.querySelectorAll<HTMLElement>("[data-browse-game]") ?? []),
  ];
  const groups = [
    ...(browseRoot?.querySelectorAll<HTMLElement>("[data-browse-group]") ?? []),
  ];

  if (!form || !input || !status || !empty || games.length === 0) return;
  form.hidden = false;

  const update = () => {
    const query = input.value;
    let visibleCount = 0;
    for (const game of games) {
      const matches = matchesBrowseSearch(game.dataset.search ?? "", query);
      game.hidden = !matches;
      if (matches) visibleCount += 1;
    }
    for (const group of groups) {
      group.hidden = !group.querySelector("[data-browse-game]:not([hidden])");
    }

    const normalizedQuery = normalizeBrowseText(query);
    empty.hidden = visibleCount !== 0 || !normalizedQuery;
    empty.textContent = empty.hidden
      ? ""
      : `No games match “${query.trim()}”. Check the spelling or clear the search.`;
    status.textContent = normalizedQuery
      ? `${visibleCount} ${visibleCount === 1 ? "game" : "games"} found.`
      : "";
  };

  form.addEventListener("input", update);
  form.addEventListener("reset", () => {
    setTimeout(update, 0);
  });
}

if (typeof document !== "undefined") initBrowseSearch();
