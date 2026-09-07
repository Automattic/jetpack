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
