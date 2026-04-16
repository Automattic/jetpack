# Autoresearch Ideas

## High Impact (try first)

- **Add `--frozen-lockfile` to all workflow pnpm installs**: Skip resolution step. Safe for all CI jobs since lockfile should always be in sync. May save 10-30s per job × 15+ jobs.

- **Add `--prefer-offline` flag to workflow pnpm installs**: Avoid network metadata checks when cache is warm. May save 5-30s per job depending on how many packages pnpm is checking online.

- **Cache node_modules between jobs in same workflow run**: Use GitHub Actions cache with `run_id` in the key. A "setup" job runs `pnpm install` once and caches `node_modules`. All subsequent jobs restore this cache and skip install entirely. Potential savings: 60-120s × (N-1) jobs.

- **Consolidate linting jobs**: linting.yml has 9+ jobs each doing `pnpm install` independently. Running eslint, stylelint, and typecheck as steps in a single job would save 8 × 90s = ~12 minutes of install overhead.

## Medium Impact

- **Skip pnpm install in tool-setup for PHP-only jobs**: Some jobs only need PHP + composer, not pnpm. Already partially done (prepare job has `php: false`), but some PHP-only jobs still do pnpm install.

- **Add `node_modules-pattern` cache to restore_keys in tool-setup**: The current pnpm cache via setup-node only caches the global store. Adding the virtual store path to the cache could help.

- **Use `pnpm fetch` before `pnpm install`**: `pnpm fetch` only populates the store (faster, parallelizable). Then `pnpm install --offline` completes the linking. Could allow fetching deps in background while doing other setup steps.

- **Optimize Composer cache key granularity**: Currently `hashFiles('**/composer.lock')` - a single lock file change busts ALL composer caches. More granular keys per-project could improve hit rates.

## Low Impact / Risky

- **Remove `verifyDepsBeforeRun: install`**: This causes pnpm to verify deps before every `pnpm run ...`. Removing saves a verification step per command but reduces safety.

- **Reduce `strictPeerDependencies: true` to warning**: Could speed up install but may hide real dependency issues.

- **Merge `prepare` and `build` jobs in build.yml**: They currently run sequentially with separate installs. Could save one install, but the prepare job's output is needed for the build matrix.

- **Build artifact caching**: Cache the compiled output of packages that rarely change (e.g. large stable packages like `@automattic/jetpack-components`). Requires invalidation logic.

## Already Tried / Not Applicable

- `enableGlobalVirtualStore: true` — Local-only, auto-disabled in CI
- Force all builds — Just for timing, not an optimization
