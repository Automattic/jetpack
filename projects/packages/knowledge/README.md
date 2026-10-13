# Jetpack Knowledge

Provides the WordPress Knowledge runtime and Settings → Guidelines screen when Gutenberg's Guidelines experiment is unavailable.

Add `automattic/jetpack-knowledge` to your plugin's Composer dependencies and call `Automattic\Jetpack\Knowledge::init()` during plugin loading. Use the Jetpack Autoloader when several plugins may bundle the package. Build the package and its dependencies before distributing your plugin.

The package waits until plugin loading has completed before choosing a provider. An enabled Gutenberg Guidelines experiment owns the runtime and screen; otherwise this package supplies both. An already-registered `wp_knowledge` post type or loaded Gutenberg Knowledge implementation also takes precedence. When supplying the fallback, the package removes Gutenberg's dormant generated page callbacks so its disabled experiment cannot enqueue a second app or register duplicate routes. Repeated initialization is safe.

## Data contract

Both providers use `wp_knowledge`, `wp_knowledge_type`, `/wp/v2/knowledge`, and `/wp/v2/knowledge/guideline-scopes`. Records retain their IDs, content, terms, and metadata when the experiment is toggled. No migration or duplicate storage is needed. On connected Jetpack sites, these posts follow the existing Jetpack Sync policy, just as Gutenberg-provided Knowledge records do.

The upstream `wp_knowledge_types`, `wp_guideline_scopes`, and `wp_guideline_max_length` extension points remain available. Guideline rows retain the `guideline-` and `guideline-block-` slug conventions. Private records, capabilities, revisions, sanitization, and REST permissions follow the upstream implementation.

## Screen and assets

The complete Gutenberg screen is ported with its existing labels, settings URL, sections, dialogs, and import/export format. Jetpack's AI enhancement remains a separate consumer with its own eligibility rules. Assets load only on the Guidelines settings page. The shared `jetpack-wp-build-polyfills` package supplies missing admin framework dependencies on supported WordPress versions.

Build with `jp build packages/knowledge --deps`. Run `jp test php packages/knowledge`, `jp test js packages/knowledge`, and `jp phan packages/knowledge`. The PHP suite uses the shared SQLite WordPress test environment and requires the PHP PDO SQLite extension.

## Upstream provenance

Ported from [WordPress/Gutenberg](https://github.com/WordPress/gutenberg/tree/5f2660c2dff39621b8eb7a0d7484796bc37cc665): `lib/experimental/knowledge`, `routes/guidelines`, and the `isContentBlock` predicate in `packages/blocks/src/api/utils.ts`.

Integration changes are limited to provider selection, PHP class namespacing and translation domains, package asset registration, and replacing the private block predicate import with the same predicate using the public block registry. The upstream screen source and its behavior remain the reference for future updates.

WordPress.com Simple uses the partial loader in `wp-content/mu-plugins/0-wpcom-jetpack-loader.php` and must initialize the package through that platform bootstrap. Removing `gutenberg_wpcom_enable_guidelines_experiment()` from the option filter in `wp-content/mu-plugins/wpcom-gutenberg-load.php` is a dependent rollout change after this package has been deployed and verified; preserve stored explicit experiment opt-ins.

Licensed under GPL-2.0-or-later.

The package mirror is `Automattic/jetpack-knowledge`. Automatic release tagging is disabled until its release credentials are configured.
