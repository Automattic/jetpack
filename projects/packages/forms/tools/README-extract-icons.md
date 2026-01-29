# Block Icons Extract (Build-Time)

Block icons (from `field-*` and other blocks) are React elements or use `renderMaterialIcon` / `@wordpress/icons`. The Interactivity API views (e.g. `file-field/view.js`) run without React, so they cannot render those icons directly.

**Solution:** At build time we extract each block icon’s markup (SVG HTML string) from the same source the blocks use, and write them to `src/modules/block-icons.generated.json`. Interactivity API code can then use that JSON without React.

## Flow

1. **Generate runner**  
   `node tools/generate-extract-icons-runner.js`  
   Discovers all `src/blocks/*/icon.js` and writes `tools/extract-block-icons-runner.js` with static imports.

2. **Build extractor**  
   `webpack --config tools/webpack.config.extract-icons.js`  
   Builds the runner (and its icon imports) for Node → `dist/extract-block-icons.cjs`.

3. **Run extractor**  
   `node tools/run-extract-block-icons.cjs`  
   Sets up a minimal DOM (jsdom) so `@wordpress/components` can load, then runs the built script. It renders each icon with `ReactDOMServer.renderToStaticMarkup()` and writes:
   - **`src/modules/block-icons.generated.json`** — block name → SVG HTML string (for JS/Interactivity API)
   - **`src/contact-form/block-icons-generated.php`** — PHP file returning the same map (for PHP, e.g. `wp_interactivity_config()`)

**Single command:** `pnpm run extract-icons` (runs all three steps).

You don’t need to run it separately: **`pnpm run build`** and **`pnpm run watch`** both run `extract-icons` first (build runs it before `module:build`; watch runs it once at start before the watchers). So running either build or watch is enough.

`src/modules/block-icons.generated.json` is committed with `{}` so the repo builds even before `extract-icons` is run (e.g. before jsdom is installed). After a successful `extract-icons`, it contains block name → SVG HTML string.

## Requirements

- **jsdom** (devDependency) — needed because the extractor loads `@wordpress/components` (Icon, etc.), which expects `document` at load time. The wrapper `tools/run-extract-block-icons.cjs` sets up jsdom before requiring the built script.

## Consuming in Interactivity API

In a module view (e.g. `file-field/view.js`):

```js
import blockIcons from '../block-icons.generated.json';

// blockIcons['jetpack/field-file'] is the upload icon SVG string
// blockIcons['jetpack/field-url'] is the globe icon SVG string
// Use in a callback, e.g. element.innerHTML = blockIcons['jetpack/field-file'];
```

Or pass the needed icon from PHP via `wp_interactivity_config()` and use it in the view. In PHP, require the generated file and use the returned array:

```php
$block_icons = require __DIR__ . '/block-icons-generated.php';
// $block_icons['jetpack/field-file'] is the upload icon SVG string
```

## Adding a new block icon

Add `icon.js` under `src/blocks/<block-name>/` (same as today). The next run of `generate-extract-icons-runner.js` will pick it up and include it in the extract. No other changes needed.
