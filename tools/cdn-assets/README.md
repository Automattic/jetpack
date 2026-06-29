# CDN Asset Manifests

`build-asset-manifest.mjs` turns package build output into a CDN publishing
contract without changing the local runtime layout. It copies content-hashed
browser assets beside the original generated files and writes
`build/asset-manifest.json`.

The package `build/` directory may still contain generated PHP required for
local/plugin runtime. CDN publishing should use `asset-manifest.json` and upload
only `publishFiles`.

## Publishing Rules

Include:

- content-hashed JavaScript and CSS files listed in `publishFiles`;
- static runtime files listed in `publishFiles`, such as images, fonts, wasm, or
  JSON files;
- `asset-manifest.json`.

Exclude:

- generated PHP, including `build.php`, `constants.php`, registries, and
  `*.asset.php`;
- un-hashed JavaScript and CSS entry files when hashed copies exist;
- source maps unless production debugging explicitly needs them.

The manifest records the CDN compatibility directory as `version` (currently
`v1`). The local output remains directly under each package's `build/`
directory; the deploy destination supplies paths such as
`premium-analytics/v1/`.
