<?php
/**
 * Trait for handling WordPress version-specific test expectations.
 *
 * WordPress trunk (7.0+) changed block output in Gutenberg PR #71207,
 * removing layout classes like 'is-layout-flow' and 'wp-block-quote-is-layout-flow'.
 *
 * This trait provides helper methods to handle version-specific expectations in tests.
 *
 * @todo Remove this trait once WP 7.0 is the minimum supported version.
 *
 * @package automattic/jetpack-mu-wpcom
 */

trait Jetpack_Mu_Wpcom_WP_Version_Test_Helpers {

	/**
	 * Determine if we're testing against WordPress 7.0+ (trunk).
	 *
	 * WordPress 7.0+ removed layout classes from block output (Gutenberg PR #71207).
	 *
	 * @return bool True if WordPress 7.0+, false otherwise.
	 */
	protected function is_wp_7_or_higher() {
		global $wp_version;

		if ( empty( $wp_version ) ) {
			return false;
		}

		return version_compare( $wp_version, '7.0-dev', '>=' );
	}

	/**
	 * Get version-appropriate expected HTML for block output.
	 *
	 * @param string $html_without_layout_classes HTML without layout classes (WP 7.0+ format).
	 * @param string $html_with_layout_classes HTML with layout classes (WP 6.9 and earlier format).
	 * @return string The appropriate HTML for the current WordPress version.
	 */
	protected function get_version_specific_expected_html( $html_without_layout_classes, $html_with_layout_classes ) {
		if ( $this->is_wp_7_or_higher() ) {
			return $html_without_layout_classes;
		}

		return $html_with_layout_classes;
	}
}
