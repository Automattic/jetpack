# Jetpack Knowledge

Provides the WordPress Knowledge runtime when Gutenberg's Guidelines experiment is unavailable. This package contains storage and REST APIs; it does not register an admin screen or enqueue assets.

Add `automattic/jetpack-knowledge` to your plugin's Composer dependencies and call `Automattic\Jetpack\Knowledge::init()` during plugin loading. Use the Jetpack Autoloader when several plugins may bundle the package.

The package waits until plugin loading has completed before choosing a provider. An enabled Gutenberg Guidelines experiment owns the runtime; otherwise this package supplies the fallback. An already-registered `wp_knowledge` post type or an existing `wp_knowledge_types()` function also takes precedence, including a native provider that registers its post type later on `init`. Repeated initialization is safe. Gutenberg's screen callbacks are left unchanged.

## Data contract

Both providers use `wp_knowledge`, `wp_knowledge_type`, `/wp/v2/knowledge`, and `/wp/v2/knowledge/guideline-scopes`. Records retain their IDs, content, terms, and metadata when the experiment is toggled. No migration or duplicate storage is needed. On connected Jetpack sites, these posts follow the existing Jetpack Sync policy, just as Gutenberg-provided Knowledge records do.

The upstream `wp_knowledge_types`, `wp_guideline_scopes`, and `wp_guideline_max_length` extension points remain available. Guideline rows retain the `guideline-` and `guideline-block-` slug conventions. Private records, capabilities, revisions, sanitization, and REST permissions follow the upstream implementation. Consumers supply their own interface.

## Validation

Run `jp test php packages/knowledge` and `jp phan packages/knowledge`. The PHP suite uses the shared SQLite WordPress test environment and requires the PHP PDO SQLite extension. Provider integration tests include the actual pinned Gutenberg Knowledge experiment backend, covering both plugin orders and early REST initialization. There is no JavaScript build or test step.

## Upstream provenance

The backend is ported from [`lib/experimental/knowledge` in WordPress/Gutenberg](https://github.com/WordPress/gutenberg/tree/5f2660c2dff39621b8eb7a0d7484796bc37cc665/lib/experimental/knowledge). The Guidelines screen and its assets are excluded.

Integration changes cover provider selection, PHP class namespacing and translation domains. The scope schema description reflects the existing hyphenated identifiers. Term creation recovers the winning term ID when concurrent inserts race.

WordPress.com Simple uses the partial loader in `wp-content/mu-plugins/0-wpcom-jetpack-loader.php` and must initialize the package through that platform bootstrap. Removing `gutenberg_wpcom_enable_guidelines_experiment()` from the option filter in `wp-content/mu-plugins/wpcom-gutenberg-load.php` is a dependent rollout change after this package has been deployed and verified; preserve stored explicit experiment opt-ins. Disabling the experiment does not add a replacement Guidelines screen.

Licensed under GPL-2.0-or-later.

The package mirror is `Automattic/jetpack-knowledge`. Automatic release tagging is disabled until its release credentials are configured.
