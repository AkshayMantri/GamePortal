# Local D1 link-health baseline

This baseline stores mutable link-health evidence without duplicating the static catalog. `availability_observation` is an append-only history keyed to stable catalog Destination IDs. `destination_current_status` is a mutable projection that points to a matching observation or records a reasoned manual classification. It does not redefine whether an Access Option is playable or published.

## Prerequisites and safety boundary

- Use the exact Node.js, pnpm, and Wrangler versions pinned by the repository.
- The `DB` binding has `remote: false`, no database identifier, and no preview identifier.
- Every D1 operation below names `--local`. Omitting it is outside this bootstrap's authorization.
- Wrangler 4.111.0 migration and execute help do not offer a `--no-x-provision` flag. Safety instead comes from the binding-only configuration, `remote: false`, and mandatory local targeting.
- Do not authorize authentication, provisioning, or a cloud-database operation from this repository state.

Wrangler persists ordinary local state beneath `.wrangler/state`. The automated integration test passes an OS-created temporary directory with `--persist-to`, verifies that exact path is outside the repository, and deletes only that directory afterward.

## Apply and inspect locally

Apply pending numbered migrations:

```powershell
corepack pnpm exec wrangler d1 migrations apply DB --local
```

Run the focused integration test, which applies the migration twice to prove the second application is a no-op:

```powershell
corepack pnpm test:d1:local
```

Inspect migration history:

```powershell
corepack pnpm exec wrangler d1 execute DB --local --command "SELECT id, name, applied_at FROM d1_migrations ORDER BY id;" --json
```

Inspect the recent observations for a reviewed Destination ID:

```powershell
corepack pnpm exec wrangler d1 execute DB --local --command "SELECT id, checked_at, classification, confidence FROM availability_observation WHERE destination_id = 'dest_example' ORDER BY checked_at DESC LIMIT 20;" --json
```

Timestamps are UTC ISO 8601 text in the exact JavaScript `Date.prototype.toISOString()` shape, for example `2026-07-17T00:00:00.000Z`. Observation methods are `head`, `get`, or `manual`; classifications are `available`, `unavailable`, `unknown`, or `error`. Operator notes and manual reasons are bounded to 500 characters and must not contain full page content, credentials, tokens, user data, or child data.

Before persistence, the future link-check boundary must normalize a final URL to an absolute form with a lowercase `https://` scheme and lowercase host. It must strip or reject user information, query strings, and fragments. Never persist credentials, capability or event secrets, tokens, sensitive query data, or an unreviewed redirect target. A retained path may identify only a reviewed public resource. The database constraint fails closed on `@`, `?`, or `#` anywhere in the final URL; this intentionally rejects ambiguous values instead of attempting URL parsing in SQLite.

## Migration and retention convention

Migrations are forward-only, top-level, numbered SQL files in `migrations/`. Never edit an applied migration; add the next numbered migration. Any destructive schema or retention operation needs explicit product-owner approval, a separate migration plan, backup/export consideration, and rollback notes.

The schema does not automatically compact link observations. Product planning says to keep enough history to detect patterns and compact old detail, but the exact retention interval is not yet approved. Until a later explicit operation exists, the append-only triggers reject update and deletion. The current-status projection may change without rewriting observation history.

## Manual local reset

This is a deliberately manual recovery step for disposable emulator data only. It destroys the repository's local emulator state, is never run by a package script or test, and cannot target a cloud database. Run it only from the repository root after confirming the printed path is exactly `<repository>/.wrangler/state`.

```powershell
$repositoryRoot = (Resolve-Path -LiteralPath ".").Path
$expectedState = [IO.Path]::GetFullPath((Join-Path $repositoryRoot ".wrangler\state"))
if (-not (Test-Path -LiteralPath $expectedState -PathType Container)) { throw "Local D1 state does not exist: $expectedState" }
$stateItem = Get-Item -LiteralPath $expectedState -Force
if (($stateItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) { throw "Refusing reparse-point reset target: $expectedState" }
$resolvedState = (Resolve-Path -LiteralPath $expectedState).Path
$insideRepository = $resolvedState.StartsWith($repositoryRoot + [IO.Path]::DirectorySeparatorChar)
if ($resolvedState -ne $expectedState -or -not $insideRepository) { throw "Refusing unexpected reset target: $resolvedState" }
Write-Host "Verified local-only reset target: $resolvedState"
Remove-Item -LiteralPath $resolvedState -Recurse -Force
```

After a reset, rerun the local migration command before querying.

## References

- [Cloudflare D1 local development](https://developers.cloudflare.com/d1/best-practices/local-development/)
- [Cloudflare D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)
- [Wrangler D1 commands](https://developers.cloudflare.com/workers/wrangler/commands/d1/)
