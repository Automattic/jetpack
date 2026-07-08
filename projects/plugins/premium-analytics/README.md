# Jetpack Premium Analytics Plugin

Internal WordPress plugin that activates the `automattic/jetpack-premium-analytics` package.

## Development

```bash
jetpack build plugins/premium-analytics
jetpack watch plugins/premium-analytics
```

## Installable zip

Use the local build script to create a WordPress-installable plugin zip that
combines this plugin bootstrap with the mirrored Premium Analytics package:

```bash
composer build-zip
```

By default, the script clones `trunk` from
`https://github.com/Automattic/jetpack-premium-analytics.git` and writes the zip
to `jetpack-premium-analytics.zip` in this plugin directory.

Useful options:

```bash
composer build-zip -- --package-ref <branch|tag|sha>
composer build-zip -- --package-path /path/to/jetpack-premium-analytics
```

The package source must already contain the `build/build.php` output generated
by `wp-build`. The package mirror is expected to contain this output. A local
monorepo package checkout usually needs to be built before it can be used with
`--package-path`.
