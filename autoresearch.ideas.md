# Autoresearch Ideas — Remaining After pnpm_install_calls = 0

## DONE (archived for reference)

- ✅ linting.yml: 9 separate installs → shared install_js_deps + cache restore
- ✅ build.yml: 2 installs → 1 install (prepare caches, build restores)
- ✅ e2e-tests.yml: build-projects install → cache restore from create-test-matrix
- ✅ Reusable install-deps.yml: single canonical install + caching logic
- ✅ Cross-run caching: lockfile-hash key enables 0 installs on warm lockfile
- ✅ restore-keys fallback: faster re-link after lockfile changes
- ✅ tests.yml: install_test_deps reusable job, run-tests + storybook use cache restore
- ✅ php:false for JS-only linting jobs (eslint, lint_style, typecheck, etc.)
- ✅ --frozen-lockfile --prefer-offline everywhere

## ⚠️ Key Insight: Compute vs Wall-Clock Trade-Off

The shared-install approach primarily saves **compute-minutes** (billing), not wall-clock time:
- **linting.yml**: wall-clock +1.5 min cold, ≈ 0 warm (critical path: phan at ~10 min)
- **build.yml**: wall-clock +0.5 min cold, -1 min warm
- **tests.yml**: wall-clock +1 min cold, ≈ 0 warm (critical path: 30+ min tests)
- **e2e-tests.yml**: wall-clock **-1.5 min** (build-projects savings directly on critical path)

The cold-cache penalty occurs because `install_js_deps` is a new serial gate.
The warm-cache scenario (most PRs with same lockfile) is essentially neutral.

**To eliminate the cold-cache wall-clock penalty**: run a pre-warming workflow on
that triggers on push to trunk and saves the cross-run cache. All subsequent PR
workflows would always hit the cross-run cache, making install_js_deps take ~1 min
instead of ~2.5 min, and eliminating the +1.5 min wall-clock penalty.

## High Value (Next Session)

- **Pre-warm cache on trunk push**: A workflow triggered by `push: branches: [trunk]` that
  runs `pnpm install` and saves the cross-run cache (`pnpm-workspace-{lockfile_hash}`).
  PRs branched from trunk always have the same lockfile, so they'd always hit this cache.
  install_js_deps time drops from 2.5 min to 1 min, eliminating the cold-cache wall-clock
  penalty for normal PRs. Only applies when trunk's lockfile matches the PR's lockfile
  (i.e., the PR doesn't change dependencies).

- **e2e-tests.yml cross-run caching**: The `create-test-matrix` job does pnpm install in a
  multi-line block on every e2e run. Adding the cross-run cache pattern from install-deps.yml
  would make it conditional. For e2e tests that run frequently on the same lockfile, this
  saves the full install time.

- **Composer caching improvement**: The current Composer cache key is 
  `hashFiles('**/composer.lock')`. This busts for ANY change in any package's composer.lock.
  More granular per-project keys would improve hit rates. However, the packagist proxy (304
  caching) already mitigates this significantly.

- **gardening.yml / wpcloud.yml cross-run caching**: These workflows can't call install-deps.yml
  easily (different triggers: repo_dispatch, push), but could still restore from the cross-run
  cache (`pnpm-workspace-{lockfile_hash}`) before running their own install. On cache hit, 
  they'd skip installation entirely.

## Medium Value

- **Build output caching**: Cache the compiled output of packages that rarely change (large,
  stable packages like `@automattic/jetpack-components`). The `pnpm jetpack build` takes 15 min 
  for a full build. Incremental builds based on file hashes could dramatically reduce this.
  Requires investigation into how `jetpack build` determines what to rebuild.

- **tests.yml Composer sharing**: The run-tests matrix jobs each run `composer install` for their
  own workspace packages. These could potentially use a shared Composer cache similar to our
  pnpm approach. Complexity: Composer installs are per-project, not global like pnpm.

- **Parallel build within matrix**: The build matrix currently builds wpcom and non-wpcom
  separately. Could we parallelize more within each build? The `pnpm jetpack build` already
  runs in parallel internally; investigate if we can increase parallelism.

- **`storybook-test` php:false**: Storybook tests don't need PHP. Adding `php: false` to
  tool-setup in storybook-test would save ~15s (PHP setup + proxy startup).

## Low Value / Complex

- **pnpm_install_s optimization**: The ~26s install time is I/O bound (creating symlinks for
  103 workspace packages, ~60s of system calls parallelized across cores). No practical
  config-level optimization reduces this significantly without:
  - Reducing number of workspace packages
  - Using `node-linker: hoisted` (breaks isolation, risky)
  - Faster underlying storage

- **Pre-warm cache workflow**: A scheduled workflow that runs every 6 hours, installing and
  saving the cross-run cache. Ensures fresh PRs always hit the cache. But adds workflow
  infrastructure; the current approach (first PR after lockfile change installs) works too.

- **verifyDepsBeforeRun: install consideration**: This setting triggers a pnpm install before
  every `pnpm run` command. On cached node_modules, this is a fast verification (1-2s).
  Changing to `verifyDepsBeforeRun: warn` saves this overhead but reduces safety for
  local developers who forget to run pnpm install.
