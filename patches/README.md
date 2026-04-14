# Patches

pnpm patches applied at install time. Registered in `pnpm-workspace.yaml`
under `patchedDependencies` — fully automatic, no manual steps.

## @wordpress/build@0.11.0

**Upstream PR:** https://github.com/WordPress/gutenberg/pull/77226
**Upstream issue:** https://github.com/WordPress/gutenberg/issues/77225
**Gutenberg branch:** `add/wp-build-sources-config` in `~/lab/gutenberg`

### What it does

Adds `wpPlugin.packageSources` to `@wordpress/build` — lets consumers
discover and compile packages outside the default `./packages/` directory.
Supports both directory paths and npm package names.

```json
{
  "wpPlugin": {
    "packageSources": [ "@automattic/number-formatters" ]
  }
}
```

### Why a patch

`@wordpress/build` doesn't support cross-directory package discovery.
Shared packages in Jetpack's `js-packages/` get inlined into each
consumer's bundle, duplicating code and breaking module deduplication.

The upstream PR proposes this as a core feature. The patch mirrors it 1:1
so we can use it now while the PR goes through Gutenberg review.

### How it works

The patch is a **1:1 copy** of the upstream PR diff. No Jetpack-specific
logic. The workflow:

1. Develop in `~/lab/gutenberg` on branch `add/wp-build-sources-config`
2. Regenerate the patch:
   ```bash
   pnpm patch @wordpress/build@0.11.0 --edit-dir /tmp/wp-build-patch
   cp ~/lab/gutenberg/packages/wp-build/lib/build.mjs /tmp/wp-build-patch/lib/
   cp ~/lab/gutenberg/packages/wp-build/lib/package-utils.mjs /tmp/wp-build-patch/lib/
   cp ~/lab/gutenberg/packages/wp-build/lib/wordpress-externals-plugin.mjs /tmp/wp-build-patch/lib/
   pnpm patch-commit /tmp/wp-build-patch
   ```
3. pnpm updates the patch file and `pnpm-lock.yaml` automatically

### Consumer requirements

Packages listed in `packageSources` must declare `wpScriptModuleExports`
in their `package.json` so the build system can register them as script
modules and track dependencies correctly:

```json
{
  "wpScriptModuleExports": "."
}
```

### Removal

When Gutenberg merges PR #77226 and Jetpack upgrades `@wordpress/build`
to a version that includes it:

1. Delete `patches/@wordpress__build@0.11.0.patch`
2. Remove the entry from `pnpm-workspace.yaml` `patchedDependencies`
3. Run `pnpm install`

### Current consumers

- `projects/packages/premium-analytics` — first consumer (validation)

### Potential consumers

- `projects/packages/forms` — currently inlines shared packages, would
  benefit from `packageSources` to deduplicate bundles
