# CDN Asset Manifests

`build-asset-manifest.mjs` turns package build output into a CDN publishing
contract without changing the local runtime layout. It writes
`build/build_meta.json` with stable browser asset paths, content hashes, parsed
WordPress dependency metadata, and a top-level cache buster.

By default, the tool reads the package's `package.json`, uses `build/`, and
auto-detects either:

- `wp-build` output, using generated PHP registries plus `wpPlugin.pages`;
- webpack or `wp-scripts` output, using discovered JavaScript/CSS files and
  nearby `*.asset.php` metadata.

If a package needs overrides, add `.build-asset.json` beside `package.json`.
Supported top-level settings include `buildDir`, `builder`, `namespace`, and
`version`; webpack entries can also be supplied with `webpack.entries`.

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
