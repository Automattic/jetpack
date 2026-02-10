<?php
/**
 * Trait for handling WordPress version-specific test expectations.
 *
 * WordPress trunk (7.0+) changed block output in Gutenberg PR #71207,
 * removing layout classes like 'is-layout-flow' and 'wp-block-quote-is-layout-flow'.
 *
 * This trait provides helper methods to handle version-specific expectations in tests.
 *
 * @package automattic/jetpack
 */

trait Jetpack_WP_Version_Test_Helpers {

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

		// Check if version is 7.0 or higher
		// This includes trunk builds (e.g., '7.0-alpha', '7.0-dev', '7.0', etc.)
		return version_compare( $wp_version, '7.0-dev', '>=' );
	}

	/**
	 * Remove layout classes from block HTML output.
	 *
	 * Strips classes like 'is-layout-flow' and 'wp-block-*-is-layout-flow'
	 * that were removed in WordPress 7.0+ (Gutenberg PR #71207).
	 *
	 * @param string $html The HTML content to process.
	 * @return string The HTML with layout classes removed.
	 */
	protected function remove_layout_classes( $html ) {
		// Remove is-layout-* classes
		$html = preg_replace( '/\s+is-layout-[a-z-]+/', '', $html );

		// Remove wp-block-*-is-layout-* classes
		$html = preg_replace( '/\s+wp-block-[a-z-]+-is-layout-[a-z-]+/', '', $html );

		return $html;
	}

	/**
	 * Normalize block HTML output for version-agnostic comparison.
	 *
	 * If testing against WP 7.0+, returns HTML as-is.
	 * If testing against WP 6.9 or earlier, removes layout classes to match WP 7.0+ output.
	 *
	 * @param string $html The HTML content to normalize.
	 * @return string The normalized HTML.
	 */
	protected function normalize_block_html_for_version( $html ) {
		if ( $this->is_wp_7_or_higher() ) {
			// WP 7.0+ doesn't have layout classes, so HTML is already in the expected format
			return $html;
		}

		// WP 6.9 and earlier have layout classes, so remove them to match WP 7.0+ expectations
		return $this->remove_layout_classes( $html );
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
