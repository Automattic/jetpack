# Jetpack Premium Analytics Plugin

Internal WordPress plugin that activates the `automattic/jetpack-premium-analytics` package.

## Development

```bash
jetpack build plugins/premium-analytics
jetpack watch plugins/premium-analytics
```

## Installable zip

Use the local build script to create a WordPress-installable plugin zip from the
**current monorepo working tree**:

```bash
composer build-zip
```

The script:

1. Builds the plugin for production in place (`jetpack build plugins/premium-analytics --production`),
   which installs the production autoloader and compiles the bundled
   Premium Analytics package.
2. Stages the production file set with the same file-collection `jetpack rsync`
   uses — filtered by `.gitattributes`, following the `jetpack_vendor/*` package
   symlinks — so dev-only source, configs, and dev dependencies are left out.
3. Writes `jetpack-premium-analytics.zip` to this plugin directory.

Because it builds from the working tree, any in-progress local edits to the
plugin or the bundled package are reflected in the zip.

### Requirements

- A set-up monorepo dev environment (run `pnpm install` at the repo root first).
- Standard `rsync`. macOS ships openrsync, which cannot sync the package
  symlinks and would silently produce an empty archive; install real rsync with
  `brew install rsync`. The script fails fast if it detects openrsync.

> **Note:** The build performs a production install (`composer install --no-dev`)
> in your working tree. Re-run `jetpack build plugins/premium-analytics`
> afterwards to restore your dev dependencies.
