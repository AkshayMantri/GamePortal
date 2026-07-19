import {
  parsePartySize,
  partySizeAnnouncement,
  partySizeErrorMessage,
  partySizeReceipt,
  unsetPartySize,
  type PartySizeState,
} from "../find/party-size";

export function initializePartySizeControl(
  documentRoot: ParentNode = document,
): void {
  const root = documentRoot.querySelector<HTMLElement>(
    "[data-party-size-control]",
  );
  const quickChoices = Array.from(
    root?.querySelectorAll<HTMLInputElement>("[data-party-size-quick]") ?? [],
  );
  const customChoice = root?.querySelector<HTMLInputElement>(
    "[data-party-size-custom-choice]",
  );
  const customInput = root?.querySelector<HTMLInputElement>(
    "[data-party-size-custom-input]",
  );
  const applyButton = root?.querySelector<HTMLButtonElement>(
    "[data-party-size-apply]",
  );
  const receipt = root?.parentElement?.querySelector<HTMLElement>(
    "[data-party-size-receipt]",
  );
  const error = root?.querySelector<HTMLElement>("[data-party-size-error]");
  const live = root?.parentElement?.querySelector<HTMLElement>(
    "[data-party-size-live]",
  );

  if (
    !root ||
    !customChoice ||
    !customInput ||
    !applyButton ||
    !receipt ||
    !error ||
    !live
  ) {
    return;
  }
  if (root.dataset.enhanced === "true") return;

  const baseDescription = customInput.getAttribute("aria-describedby") ?? "";

  const render = (state: PartySizeState, announce = false) => {
    root.dataset.partySizeState = state.status;
    if (state.status === "valid") {
      root.dataset.partySizeValue = String(state.value);
    } else {
      delete root.dataset.partySizeValue;
    }

    receipt.textContent = partySizeReceipt(state);
    const isInvalid = state.status === "invalid";
    error.hidden = !isInvalid;
    error.textContent = isInvalid ? partySizeErrorMessage(state.error) : "";
    if (isInvalid) {
      customInput.setAttribute("aria-invalid", "true");
    } else {
      customInput.removeAttribute("aria-invalid");
    }
    customInput.setAttribute(
      "aria-describedby",
      [baseDescription, isInvalid ? error.id : ""].filter(Boolean).join(" "),
    );

    live.textContent = announce ? partySizeAnnouncement(state) : "";
  };

  const beginCustomEntry = () => {
    customChoice.checked = true;
    render(unsetPartySize());
  };

  const submitCustomEntry = () => {
    customChoice.checked = true;
    render(parsePartySize(customInput.value), true);
  };

  for (const choice of quickChoices) {
    choice.addEventListener("change", () => {
      if (!choice.checked) return;
      render(parsePartySize(choice.value), true);
    });
  }

  customChoice.addEventListener("change", () => {
    if (customChoice.checked) render(unsetPartySize());
  });
  customInput.addEventListener("input", beginCustomEntry);
  customInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    submitCustomEntry();
  });
  applyButton.addEventListener("click", submitCustomEntry);

  root.dataset.enhanced = "true";
  render(unsetPartySize());
}

if (typeof document !== "undefined") initializePartySizeControl();
