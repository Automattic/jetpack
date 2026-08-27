<?php
/**
 * Test fixture: global build-manifest accessor stub.
 *
 * Defines the wp-build generated `jpa_get_registered_widget_modules()` in the
 * global namespace so hydration tests can feed `register_widget_types()` a
 * manifest. Returns the candidates staged in
 * `$GLOBALS['jpa_test_widget_manifest']`, or an empty list when unset, so
 * unrelated tests see a no-op manifest.
 *
 * This declaration is why bootstrap.php filters
 * `jetpack_premium_analytics_widgets_manifest_path` to this file for the whole suite:
 * build/widgets.php declares the same function unguarded, and `require_once` dedupes by
 * path rather than by symbol, so letting the real manifest load too is a fatal redeclare
 * on any checkout that has been built. Do not remove that filter without moving this
 * declaration behind a different name.
 *
 * @package automattic/jetpack-premium-analytics
 */

if ( ! function_exists( 'jpa_get_registered_widget_modules' ) ) {
	/**
	 * Returns the staged test manifest.
	 *
	 * @return array List of widget manifest candidates.
	 */
	function jpa_get_registered_widget_modules() {
		return $GLOBALS['jpa_test_widget_manifest'] ?? array();
	}
}
