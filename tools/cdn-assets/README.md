# CDN Asset Manifests

`build-asset-manifest.mjs` turns package build output into a CDN publishing
contract without changing the local runtime layout. It writes
`build/build_meta.json` with stable browser asset paths, content hashes, parsed
WordPress dependency metadata, and a top-level cache buster.

The tool reads the package's `package.json`, uses `build/`, and requires the
caller to select a build mode:

- `--mode wp-build` reads generated PHP registries plus `wpPlugin.pages`;
- `--mode webpack` discovers JavaScript/CSS files and nearby `*.asset.php`
  metadata.

Required flags: `--namespace` and `--mode`. Optional: `--version` (defaults to
`v1`), `--package-dir` (defaults to `.`), and `--build-dir` (defaults to
`build`). For example:

```sh
node tools/cdn-assets/build-asset-manifest.mjs \
  --package-dir . --namespace premium-analytics --version v1 --mode wp-build
```

## Schema (`schemaVersion: 2`)

WordPress dependency arrays are deduplicated. Instead of repeating identical
arrays on every asset, the manifest carries two top-level interned tables:

- `dependencySets`: an array of distinct classic-script `dependencies` arrays
  (sorted handle lists).
- `moduleDependencySets`: an array of distinct script-module `moduleDependencies`
  arrays. Object entries use a canonical key order (`id` before `import`) and are
  sorted, so equivalent dependencies always intern to the same entry.

Each asset under `assets` references its dependencies **by integer index** into
those tables, for example:

```jsonc
"routes/main/route.min.js": {
  "file": "routes/main/route.min.js",
  "type": "route-module",
  "version": "<content hash>",   // the per-asset ?ver= cache-buster
  "dependencies": 0,             // index into dependencySets
  "moduleDependencies": 3        // index into moduleDependencySets
}
```

A consumer resolves an asset's dependencies with
`manifest.dependencySets[ asset.dependencies ]` and
`manifest.moduleDependencySets[ asset.moduleDependencies ]`. When an asset has no
`dependencies`/`moduleDependencies` key, it has no dependencies of that kind.
Empty arrays are interned like any other (they share a single table entry).

The `wpBuild` navigational summary keeps its own inline arrays (e.g.
`wpBuild.boot.dependencies`); only the `assets` map uses the interned indices.

## Publishing Rules

Include:

- JavaScript and CSS files listed in `publishFiles`;
- static runtime files listed in `publishFiles`, such as images, fonts, wasm, or
  JSON files;
- `build_meta.json`.

Exclude:

- generated PHP, including `build.php`, `constants.php`, registries, and
  `*.asset.php`;
- source maps unless production debugging explicitly needs them.

JavaScript and CSS filenames stay stable. Their `version` values are content
hashes intended for WordPress' `?ver=` cache-busting parameter.

The manifest records the CDN compatibility directory as `version` (currently
`v1`). The local output remains directly under each package's build directory;
the deploy destination supplies the package-specific path.
