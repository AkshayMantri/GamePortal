import {
  activeNonPartyFilterCount,
  canonicalFindUrl,
  clearFindFilters,
  decodeFindFilters,
  defaultFindFilterState,
  findFilterStatesEqual,
  findFilterSummary,
  removeFindFilter,
  type FindFilterKey,
  type FindFilterState,
  type InventoryConstraint,
  type InventoryItem,
} from "../find/filter-state.ts";
import {
  type FindFilterOptions,
  type PublicFilterOption,
} from "../find/filter-options.ts";
import { parsePartySize, partySizeErrorMessage } from "../find/party-size.ts";

const MOBILE_QUERY = "(max-width: 63.999rem)";
const TIME_PRESETS = new Set([15, 30, 45, 60, 90, 120]);

type DraftResult =
  { success: true; state: FindFilterState } | { success: false };

function checkedRadio(form: HTMLFormElement, name: string): string {
  return (
    form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)
      ?.value ?? ""
  );
}

function setRadio(form: HTMLFormElement, name: string, value: string): void {
  for (const input of form.querySelectorAll<HTMLInputElement>(
    `input[name="${name}"]`,
  )) {
    input.checked = input.value === value;
  }
}

function setError(
  form: HTMLFormElement,
  key: string,
  control: HTMLInputElement | null,
  message: string | null,
): void {
  const error = form.querySelector<HTMLElement>(`[data-error-for="${key}"]`);
  if (!error) return;
  error.hidden = !message;
  error.textContent = message ?? "";
  if (!control) return;
  const base =
    control.dataset.baseDescription ??
    control.getAttribute("aria-describedby") ??
    "";
  control.dataset.baseDescription = base;
  if (message) {
    control.setAttribute("aria-invalid", "true");
    control.setAttribute(
      "aria-describedby",
      [base, error.id].filter(Boolean).join(" "),
    );
  } else {
    control.removeAttribute("aria-invalid");
    if (base) control.setAttribute("aria-describedby", base);
    else control.removeAttribute("aria-describedby");
  }
}

function clearErrors(form: HTMLFormElement): void {
  for (const error of form.querySelectorAll<HTMLElement>("[data-error-for]")) {
    error.hidden = true;
    error.textContent = "";
  }
  for (const control of form.querySelectorAll<HTMLElement>("[aria-invalid]")) {
    control.removeAttribute("aria-invalid");
    const base = control.dataset.baseDescription;
    if (base) control.setAttribute("aria-describedby", base);
  }
}

function syncInventory(
  form: HTMLFormElement,
  category: "devices" | "equipment",
  value: InventoryConstraint,
): void {
  setRadio(form, `${category}-kind`, value.kind);
  const quantities = new Map(
    value.kind === "specified"
      ? value.items.map((item) => [item.code, item.quantity])
      : [],
  );
  for (const checkbox of form.querySelectorAll<HTMLInputElement>(
    `input[name="${category === "devices" ? "device" : "equipment"}-item"]`,
  )) {
    checkbox.checked = quantities.has(checkbox.value);
    const quantity = form.elements.namedItem(
      `${category === "devices" ? "device" : "equipment"}-quantity-${checkbox.value}`,
    );
    if (quantity instanceof HTMLInputElement) {
      quantity.value = String(quantities.get(checkbox.value) ?? 1);
    }
  }
}

function syncForm(form: HTMLFormElement, state: FindFilterState): void {
  clearErrors(form);
  setRadio(form, "play-mode", state.playMode);
  const timeChoice = form.elements.namedItem("time-choice");
  const timeCustom = form.elements.namedItem("time-custom");
  if (timeChoice instanceof HTMLSelectElement) {
    timeChoice.value =
      state.timeBudgetMinutes === null
        ? ""
        : TIME_PRESETS.has(state.timeBudgetMinutes)
          ? String(state.timeBudgetMinutes)
          : "custom";
  }
  if (timeCustom instanceof HTMLInputElement) {
    timeCustom.value =
      state.timeBudgetMinutes !== null &&
      !TIME_PRESETS.has(state.timeBudgetMinutes)
        ? String(state.timeBudgetMinutes)
        : "";
  }
  const age = form.elements.namedItem("youngest-age");
  if (age instanceof HTMLInputElement) {
    age.value = state.youngestAge === null ? "" : String(state.youngestAge);
  }
  syncInventory(form, "devices", state.devices);
  syncInventory(form, "equipment", state.equipment);
  const region = form.elements.namedItem("region");
  if (region instanceof HTMLSelectElement) region.value = state.region ?? "";
  const language = form.elements.namedItem("play-language");
  if (language instanceof HTMLSelectElement) {
    language.value = state.playLanguage ?? "";
  }
  setRadio(form, "accounts", state.accountTolerance);
  setRadio(form, "install", state.installTolerance);
  setRadio(form, "availability", state.availabilityPolicy);
}

function parseWholeNumber(
  value: string,
  minimum: number,
  maximum: number,
): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

function readInventory(
  form: HTMLFormElement,
  category: "devices" | "equipment",
  options: readonly PublicFilterOption[],
): InventoryConstraint | null {
  if (options.length === 0) return { kind: "unconstrained" };
  const kind = checkedRadio(form, `${category}-kind`);
  if (kind === "unconstrained") return { kind: "unconstrained" };
  if (kind === "none") return { kind: "none" };

  const singular = category === "devices" ? "device" : "equipment";
  const selected = [
    ...form.querySelectorAll<HTMLInputElement>(
      `input[name="${singular}-item"]:checked`,
    ),
  ];
  const firstControl = form.querySelector<HTMLInputElement>(
    `input[name="${singular}-item"]`,
  );
  if (selected.length === 0) {
    setError(
      form,
      category,
      firstControl,
      `Choose at least one ${singular}, or choose no ${category} available.`,
    );
    return null;
  }

  const allowed = new Set(options.map(({ code }) => code));
  const items: InventoryItem[] = [];
  for (const checkbox of selected) {
    const quantity = form.elements.namedItem(
      `${singular}-quantity-${checkbox.value}`,
    );
    const parsed =
      quantity instanceof HTMLInputElement
        ? parseWholeNumber(quantity.value, 1, 99)
        : null;
    if (!allowed.has(checkbox.value) || parsed === null) {
      setError(
        form,
        category,
        quantity instanceof HTMLInputElement ? quantity : firstControl,
        "Enter a quantity from 1 to 99.",
      );
      return null;
    }
    items.push({ code: checkbox.value, quantity: parsed });
  }
  setError(form, category, firstControl, null);
  return { kind: "specified", items };
}

function readDraft(
  form: HTMLFormElement,
  committed: FindFilterState,
  options: FindFilterOptions,
): DraftResult {
  clearErrors(form);
  let valid = true;
  let timeBudgetMinutes: number | null = null;
  const timeChoice = form.elements.namedItem("time-choice");
  const timeCustom = form.elements.namedItem("time-custom");
  if (timeChoice instanceof HTMLSelectElement && timeChoice.value) {
    if (timeChoice.value === "custom") {
      const value =
        timeCustom instanceof HTMLInputElement ? timeCustom.value : "";
      timeBudgetMinutes = parseWholeNumber(value, 1, 1440);
      if (value.trim() === "") {
        valid = false;
        setError(
          form,
          "time",
          timeCustom instanceof HTMLInputElement ? timeCustom : null,
          "Enter the number of minutes available.",
        );
      } else if (timeBudgetMinutes === null) {
        valid = false;
        setError(
          form,
          "time",
          timeCustom instanceof HTMLInputElement ? timeCustom : null,
          "Enter a whole number from 1 to 1,440 minutes.",
        );
      }
    } else {
      timeBudgetMinutes = parseWholeNumber(timeChoice.value, 1, 1440);
    }
  }

  let youngestAge: number | null = null;
  const age = form.elements.namedItem("youngest-age");
  if (age instanceof HTMLInputElement && age.value.trim() !== "") {
    youngestAge = parseWholeNumber(age.value, 0, 120);
    if (youngestAge === null) {
      valid = false;
      setError(form, "age", age, "Enter a whole age from 0 to 120.");
    }
  }

  const devices = readInventory(form, "devices", options.devices);
  const equipment = readInventory(form, "equipment", options.equipment);
  if (!devices || !equipment) valid = false;
  if (!valid) return { success: false };

  const region = form.elements.namedItem("region");
  const language = form.elements.namedItem("play-language");
  return {
    success: true,
    state: {
      ...committed,
      playMode: checkedRadio(form, "play-mode") as FindFilterState["playMode"],
      timeBudgetMinutes,
      youngestAge,
      devices: devices!,
      equipment: equipment!,
      region:
        region instanceof HTMLSelectElement && region.value
          ? region.value
          : null,
      playLanguage:
        language instanceof HTMLSelectElement && language.value
          ? language.value
          : null,
      accountTolerance: checkedRadio(
        form,
        "accounts",
      ) as FindFilterState["accountTolerance"],
      installTolerance: checkedRadio(
        form,
        "install",
      ) as FindFilterState["installTolerance"],
      availabilityPolicy: (checkedRadio(form, "availability") ||
        "include_unknown") as FindFilterState["availabilityPolicy"],
    },
  };
}

export function initializeFindFilterController(
  documentRoot: Document = document,
): void {
  const root = documentRoot.querySelector<HTMLElement>(
    "[data-find-controller]",
  );
  if (!root || root.dataset.enhanced === "true") return;

  let options: FindFilterOptions;
  try {
    options = JSON.parse(root.dataset.findOptions ?? "") as FindFilterOptions;
  } catch {
    return;
  }

  const form = root.querySelector<HTMLFormElement>("[data-find-filter-form]");
  const desktopHost = root.querySelector<HTMLElement>(
    "[data-filter-desktop-host]",
  );
  const dialogHost = root.querySelector<HTMLElement>(
    "[data-filter-dialog-host]",
  );
  const dialog = root.querySelector<HTMLDialogElement>("[data-filter-dialog]");
  const openButton =
    documentRoot.querySelector<HTMLButtonElement>("[data-filter-open]");
  const summaryList = documentRoot.querySelector<HTMLUListElement>(
    "[data-find-summary-list]",
  );
  const emptySummary = documentRoot.querySelector<HTMLElement>(
    "[data-find-empty-summary]",
  );
  const clearButton =
    documentRoot.querySelector<HTMLButtonElement>("[data-find-clear]");
  const live = documentRoot.querySelector<HTMLElement>("[data-find-live]");
  const notice = documentRoot.querySelector<HTMLElement>(
    "[data-find-link-notice]",
  );
  const dismissNotice = documentRoot.querySelector<HTMLButtonElement>(
    "[data-find-link-dismiss]",
  );
  const partyRoot = documentRoot.querySelector<HTMLElement>(
    "[data-party-size-control]",
  );
  const partyQuick = [
    ...documentRoot.querySelectorAll<HTMLInputElement>(
      "[data-party-size-quick]",
    ),
  ];
  const partyCustomChoice = documentRoot.querySelector<HTMLInputElement>(
    "[data-party-size-custom-choice]",
  );
  const partyInput = documentRoot.querySelector<HTMLInputElement>(
    "[data-party-size-custom-input]",
  );
  const partyApply = documentRoot.querySelector<HTMLButtonElement>(
    "[data-party-size-apply]",
  );
  const partyError = documentRoot.querySelector<HTMLElement>(
    "[data-party-size-error]",
  );

  if (
    !form ||
    !desktopHost ||
    !dialogHost ||
    !dialog ||
    !openButton ||
    !summaryList ||
    !emptySummary ||
    !clearButton ||
    !live ||
    !notice ||
    !dismissNotice ||
    !partyRoot ||
    !partyCustomChoice ||
    !partyInput ||
    !partyApply ||
    !partyError
  ) {
    return;
  }

  const media = window.matchMedia(MOBILE_QUERY);
  let committed = defaultFindFilterState();

  const announce = (message: string) => {
    live.textContent = "";
    window.setTimeout(() => {
      live.textContent = message;
    }, 0);
  };

  const renderParty = () => {
    partyRoot.dataset.partySizeState =
      committed.partySize === null ? "unset" : "valid";
    if (committed.partySize === null) delete partyRoot.dataset.partySizeValue;
    else partyRoot.dataset.partySizeValue = String(committed.partySize);
    for (const choice of partyQuick) {
      choice.checked = committed.partySize === Number(choice.value);
    }
    if (committed.partySize !== null && committed.partySize > 8) {
      partyCustomChoice.checked = true;
      partyInput.value = String(committed.partySize);
    } else if (documentRoot.activeElement !== partyInput) {
      partyCustomChoice.checked = false;
      partyInput.value = "";
    }
    partyInput.removeAttribute("aria-invalid");
    partyError.hidden = true;
    partyError.textContent = "";
  };

  const renderSummary = () => {
    const items = findFilterSummary(committed, options);
    summaryList.replaceChildren();
    for (const [index, item] of items.entries()) {
      const listItem = documentRoot.createElement("li");
      const button = documentRoot.createElement("button");
      button.type = "button";
      button.dataset.removeFilter = item.key;
      button.dataset.summaryIndex = String(index);
      button.setAttribute("aria-label", item.removeLabel);
      button.textContent = `${item.label} ×`;
      listItem.append(button);
      summaryList.append(listItem);
    }
    const hasItems = items.length > 0;
    summaryList.hidden = !hasItems;
    emptySummary.hidden = hasItems;
    clearButton.hidden = !hasItems;
    const nonParty = activeNonPartyFilterCount(committed);
    const label =
      nonParty === 0 ? "More filters" : `More filters, ${nonParty} selected`;
    openButton.textContent = label;
    openButton.setAttribute("aria-label", label);
  };

  const renderCommitted = (syncDraft = true) => {
    renderParty();
    renderSummary();
    if (syncDraft) syncForm(form, committed);
  };

  const commit = (next: FindFilterState, message: string): boolean => {
    if (findFilterStatesEqual(committed, next, options)) {
      renderCommitted();
      return false;
    }
    committed = next;
    history.pushState(null, "", canonicalFindUrl(committed, options));
    renderCommitted();
    announce(message);
    return true;
  };

  const closeSheet = () => {
    if (dialog.open) dialog.close();
    documentRoot.body.classList.remove("find-dialog-open");
    if (media.matches) openButton.focus();
  };

  const discardDraft = () => {
    syncForm(form, committed);
    closeSheet();
  };

  const syncPlacement = () => {
    if (media.matches) {
      if (form.parentElement !== dialogHost) dialogHost.append(form);
    } else {
      if (dialog.open) dialog.close();
      if (form.parentElement !== desktopHost) desktopHost.append(form);
    }
  };

  const decoded = decodeFindFilters(window.location.search, options);
  committed = decoded.state;
  const canonical = canonicalFindUrl(committed, options);
  const current = `${window.location.pathname}${window.location.search}`;
  if (
    current !== canonical &&
    !(window.location.pathname === "/" && !window.location.search)
  ) {
    history.replaceState(null, "", canonical);
  }
  notice.hidden = decoded.issues.length === 0;
  syncPlacement();
  renderCommitted();

  media.addEventListener("change", syncPlacement);
  openButton.addEventListener("click", () => {
    syncForm(form, committed);
    syncPlacement();
    if (media.matches && !dialog.open) {
      dialog.showModal();
      documentRoot.body.classList.add("find-dialog-open");
      form.querySelector<HTMLElement>("input, select, button")?.focus();
    } else {
      form.scrollIntoView({ block: "start" });
      form.querySelector<HTMLElement>("input, select, button")?.focus();
    }
  });
  form
    .querySelector("[data-filter-close]")
    ?.addEventListener("click", discardDraft);
  form
    .querySelector("[data-filter-cancel]")
    ?.addEventListener("click", discardDraft);
  form.querySelector("[data-filter-reset]")?.addEventListener("click", () => {
    syncForm(form, defaultFindFilterState());
    announce("Draft filters reset.");
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    discardDraft();
  });
  dialog.addEventListener("close", () => {
    documentRoot.body.classList.remove("find-dialog-open");
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) discardDraft();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = readDraft(form, committed, options);
    if (!result.success) {
      announce("Check the marked settings.");
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    commit(result.state, "Setup updated.");
    closeSheet();
  });

  const timeChoice = form.elements.namedItem("time-choice");
  const timeCustom = form.elements.namedItem("time-custom");
  if (
    timeCustom instanceof HTMLInputElement &&
    timeChoice instanceof HTMLSelectElement
  ) {
    timeCustom.addEventListener("input", () => {
      timeChoice.value = "custom";
      setError(form, "time", timeCustom, null);
    });
  }
  for (const category of ["devices", "equipment"] as const) {
    const singular = category === "devices" ? "device" : "equipment";
    for (const control of form.querySelectorAll<HTMLInputElement>(
      `input[name="${singular}-item"], input[name^="${singular}-quantity-"]`,
    )) {
      control.addEventListener("input", () => {
        setRadio(form, `${category}-kind`, "specified");
        setError(form, category, control, null);
      });
    }
  }

  for (const choice of partyQuick) {
    choice.addEventListener("change", () => {
      if (!choice.checked) return;
      const parsed = parsePartySize(choice.value);
      if (parsed.status !== "valid") return;
      commit(
        { ...committed, partySize: parsed.value },
        `Party size set to ${parsed.value} ${parsed.value === 1 ? "player" : "players"}.`,
      );
    });
  }
  partyCustomChoice.addEventListener("change", () => {
    if (partyCustomChoice.checked) partyInput.focus();
  });
  partyInput.addEventListener("input", () => {
    partyCustomChoice.checked = true;
    partyInput.removeAttribute("aria-invalid");
    partyError.hidden = true;
    partyError.textContent = "";
  });
  const submitParty = () => {
    partyCustomChoice.checked = true;
    const parsed = parsePartySize(partyInput.value);
    if (parsed.status === "invalid") {
      partyInput.setAttribute("aria-invalid", "true");
      partyError.hidden = false;
      partyError.textContent = partySizeErrorMessage(parsed.error);
      announce(partySizeErrorMessage(parsed.error));
      return;
    }
    if (parsed.status === "valid") {
      commit(
        { ...committed, partySize: parsed.value },
        `Party size set to ${parsed.value} ${parsed.value === 1 ? "player" : "players"}.`,
      );
    }
  };
  partyApply.addEventListener("click", submitParty);
  partyInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitParty();
  });

  summaryList.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>(
      "[data-remove-filter]",
    );
    if (!button) return;
    const index = Number(button.dataset.summaryIndex ?? 0);
    const key = button.dataset.removeFilter as FindFilterKey;
    commit(removeFindFilter(committed, key, options), "Filter removed.");
    const remaining = summaryList.querySelectorAll<HTMLButtonElement>(
      "[data-remove-filter]",
    );
    (remaining[Math.min(index, remaining.length - 1)] ?? openButton).focus();
  });
  clearButton.addEventListener("click", () => {
    commit(clearFindFilters(), "Setup cleared.");
    openButton.focus();
  });
  dismissNotice.addEventListener("click", () => {
    notice.hidden = true;
  });
  window.addEventListener("popstate", () => {
    const restored = decodeFindFilters(window.location.search, options);
    committed = restored.state;
    notice.hidden = restored.issues.length === 0;
    renderCommitted();
    announce("Setup restored.");
  });

  root.dataset.enhanced = "true";
}

if (typeof document !== "undefined") initializeFindFilterController();
