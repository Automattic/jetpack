# Gutenberg Knowledge integration fixture

Unmodified backend files from `lib/experimental/knowledge` at [WordPress/gutenberg@5f2660c2dff39621b8eb7a0d7484796bc37cc665](https://github.com/WordPress/gutenberg/tree/5f2660c2dff39621b8eb7a0d7484796bc37cc665/lib/experimental/knowledge), licensed GPL-2.0-or-later. Keep the files together when updating the pinned revision.

The provider integration test loads the actual experiment bootstrap, public functions and controllers during plugin loading, before replaying the plugin lifecycle hooks. It covers both plugin orders and REST initialization before Gutenberg loads. This fixture does not load the complete Gutenberg plugin or its screen assets. Fixtures are excluded from production distributions.
