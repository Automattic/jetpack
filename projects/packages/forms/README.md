# Jetpack Forms

All things forms. This package currently contains the implementation for Jetpack's Contact Form module, Form blocks, and the new Jetpack Forms feedback dashboard.

## Hierarchy

```
.
├── src/
│   ├── blocks/                                      - Form blocks.
│   ├── contact-form/                                - Contact form module implementation.
│   ├── dashboard/                                   - Implementation for the new forms dashboard.
│   ├── service/                                     - Helpers for 3rd-party service integrations.
│   ├── class-jetpack-forms.php                      - Package entrypoint.
│
└── tools/                                           - Webpack configuration for all bundles in the package.
    ├── extract-icons.mjs                              - React → SVG icon extractor (see below).
    └── rasterize-icons.mjs                            - SVG → PNG icon rasterizer (see below).
```

See the individual subdirectories for more information.

## Generating block icons for email templates

Block field icons are defined as React components (`src/blocks/field-*/icon.{js,jsx,tsx}`) but need to be available as standalone files for email templates. Two scripts handle this:

1. **`extract-icons`** — Renders each React icon component to static SVG markup and writes `icon.svg` files.
2. **`rasterize-icons`** — Converts each `icon.svg` to a 48x48 retina PNG (`field-*@2x.png`) with transparent background, optimized for minimal file size.

Run the full pipeline:

```bash
pnpm generate-icons
```

Or run each step individually:

```bash
pnpm extract-icons     # React components → icon.svg
pnpm rasterize-icons   # icon.svg → icon@2x.png
```

Run these after adding or modifying any icon component in a `field-*` block directory.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

forms is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
