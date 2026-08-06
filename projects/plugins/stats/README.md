# Jetpack Stats

A standalone WordPress plugin that ships the Jetpack Stats experience without the full Jetpack plugin.

This project is a packaging shell. All the behaviour lives in monorepo packages:

- `automattic/jetpack-stats` — the tracking pixel, the `view_stats` capability map, the REST provider.
- `automattic/jetpack-stats-admin` — the Odyssey dashboard wrapper and the REST proxy to the WordPress.com stats API.
- `automattic/jetpack-connection` — the WordPress.com connection.
- `automattic/jetpack-my-jetpack` — the My Jetpack product card.

## Requires a WordPress.com connection

Stats is a WordPress.com client. Collection happens through the `pixel.wp.com/g.gif` pixel and reporting reads back from the WordPress.com REST API. The plugin is inert until a connection completes. This is by design and is not something this plugin changes.

## Coexisting with the Jetpack plugin

While the full Jetpack plugin is active it owns the `stats` admin menu, because it chooses between the legacy Stats screen and the Odyssey dashboard. This plugin registers the dashboard only when the Jetpack plugin is absent. See `Jetpack_Stats_Plugin::initialize_other_packages()`.

## Development

```bash
jp build plugins/stats
jp test php plugins/stats
jp phan plugins/stats
```

The plugin has no front-end build. The dashboard React app is served from the WordPress.com CDN by the `jetpack-stats-admin` package.

## Release

The plugin is mirrored to GitHub only. `composer.json` sets `mirror-repo` to `Automattic/jetpack-stats-plugin`, so a trunk build pushes there, and `beta-plugin-slug` to `jetpack-stats`, so builds reach the Jetpack Beta Tester.

Tagging and publishing stay off: `autotagger: false` and `autorelease: false`. There is no `wp-svn-autopublish`, and no `wp-plugin-slug`, because the plugin is not in the WordPress.org directory yet. Publishing there is tracked separately in STATS-343 Phase 6, and it is what turns `beta-plugin-slug` into `wp-plugin-slug`.
