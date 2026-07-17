# Contributing to Game Portal

## Start with authority

Read [AGENTS.md](AGENTS.md), [PLANNING_INDEX.md](PLANNING_INDEX.md), and the feature documents named by the AGENTS.md context matrix. When sources conflict, follow the documented authority order and stop at a material product, safety, privacy, data-loss, cost, or public-contract decision.

Every non-trivial change must identify relevant requirement and decision IDs. Product invariants require a dated [decision-log](DECISION_LOG.md) update before implementation.

## Change boundaries

- Keep the product strictly non-commercial: no ads, payments, affiliate tracking, sponsorship, fundraising, or paid benefit.
- Preserve `Game -> Edition/Variant -> Play Mode -> Access Option`; compatibility qualifies an Access Option, not an abstract Game.
- Unknown data never silently satisfies a strict filter.
- Do not add child accounts, child contact records, private-residence events, chat, direct messages, public attendee lists, ticketing, or payments.
- Do not copy external descriptions, rules, images, screenshots, or videos without recorded permission or license.
- Never commit secrets, credentials, tokens, private keys, production identifiers, local D1 state, coverage, browser artifacts, or debug dumps.

## Delivery workflow

Sol High owns planning, task packets, test charters, and final review. Implementers stay inside assigned file and contract boundaries. A fresh Luna XHigh context performs formal verification independently. A separate Luna XHigh Git Steward owns every Git and GitHub action, including read-only inspection, staging, commits, pushes, and pull requests. The current runtime cannot attest subagent model identity; the product owner explicitly waived attestation while preserving intended assignments and role isolation.

Do not run `git` or `gh` outside the Git Steward context. Do not weaken, skip, or rewrite a valid test merely to obtain a pass.

## Pull requests

Use the repository pull-request template. Report exact commands and results, including failures, skips, and checks not run. Describe migrations, configuration, accessibility, security/privacy, free-tier impact, rollback, and remaining risk. UI changes require responsive evidence and accessibility verification proportionate to the change.
