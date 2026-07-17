# Game Portal

Game Portal is a strictly non-commercial, guest-first web application for browsing, finding, and reaching games that fit a group's real constraints. The approved product, domain, safety, UX, and delivery authority begins at [PLANNING_INDEX.md](PLANNING_INDEX.md).

## Repository status

The repository is in its independently verified bootstrap phase. The application foundation targets static-first Astro, narrowly scoped React islands, Cloudflare Workers with static assets, and local D1 development. No production deployment or remote Cloudflare resource is part of this bootstrap.

## Local setup

Install the exact Node.js version in [.node-version](.node-version), then use Corepack so the `packageManager` field selects the pinned pnpm release:

```powershell
corepack enable
corepack install
corepack pnpm install --frozen-lockfile
```

The local commands do not log in to Cloudflare, provision resources, deploy, or require secrets.

## Development and verification

```powershell
corepack pnpm dev
corepack pnpm format:check
corepack pnpm lint
corepack pnpm check
corepack pnpm test:unit
corepack pnpm test:browser
corepack pnpm verify
```

`test:browser` builds the static site and starts the local Astro preview for bounded Chromium checks at 390px and 1440px. Install that browser once with `corepack pnpm exec playwright install chromium` if it is not already present. `verify` runs formatting, linting, Astro/type checks, unit checks, a static build, and browser/accessibility checks. Use `corepack pnpm format` to apply formatting intentionally.

The Cloudflare Vitest Workers pool is intentionally not installed yet: this static-only foundation has no Worker entry point or Worker test. Add the pool only with the first authorized Worker test so the dependency is exercised rather than carried unused.

## Working agreement

- Read [AGENTS.md](AGENTS.md) before planning or changing the repository.
- Follow the authority order in [PLANNING_INDEX.md](PLANNING_INDEX.md) and record material decisions in [DECISION_LOG.md](DECISION_LOG.md).
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for scope, testing, security, and Git ownership.
- See the initial architecture record in [ADR 0001](docs/adr/0001-astro-workers-d1-foundation.md).
- Current delivery state is recorded in the [bootstrap ledger](docs/delivery/BOOTSTRAP_LEDGER.md).
