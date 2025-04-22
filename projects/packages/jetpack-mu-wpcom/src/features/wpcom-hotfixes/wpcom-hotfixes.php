<?php
/**
 * Various hotfixes to WordPress.com
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Hotfix for a {Gutenberg 20.0.0, WP 6.7.x} bug causing the Content block to output truncated HTML.
 * See: https://github.com/WordPress/gutenberg/issues/68614
 */
if (
	// WordPress 6.7.x contains the buggy remove_serialized_parent_block() function.
	version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {

	add_filter(
		'the_content',
		function ( $content ) {
			if ( has_filter( 'the_content', 'remove_serialized_parent_block' ) ) {
				// We will revert the content manipulation done in https://github.com/WordPress/gutenberg/pull/67272.

				// Reverts https://github.com/WordPress/gutenberg/pull/67272/files#diff-611d9e2b5a9b00eb2fbe68d044eccb195759a422e36f525186d43d752bee3d71R65-R68
				remove_filter( 'the_content', 'remove_serialized_parent_block', 8 );

				// Reverts https://github.com/WordPress/gutenberg/pull/67272/files#diff-611d9e2b5a9b00eb2fbe68d044eccb195759a422e36f525186d43d752bee3d71R57-R63
				return remove_serialized_parent_block( $content );
			}
			return $content;
		},
		1
	);
}

/**
 * Hotfix for WP 6.7.x bug causing the font color on hover in the admin bar is not consistent with WP.org.
 * See https://core.trac.wordpress.org/ticket/62219.
 */
if ( version_compare( get_bloginfo( 'version' ), '6.8', '<' ) ) {
	/**
	 * Overrides for the admin color schemes.
	 */
	function wpcom_override_admin_color_scheme() {
		$suffix = is_rtl() ? '.rtl' : '';

		wp_admin_css_color(
			'modern',
			_x( 'Modern', 'admin color scheme', 'jetpack-mu-wpcom' ),
			plugins_url( "build/wpcom-hotfixes-colors-modern/wpcom-hotfixes-colors-modern$suffix.css", Jetpack_Mu_Wpcom::BASE_FILE ),
			array( '#1e1e1e', '#3858e9', '#7b90ff' ),
			array(
				'base'    => '#f3f1f1',
				'focus'   => '#fff',
				'current' => '#fff',
			)
		);
	}

	add_action( 'admin_init', 'wpcom_override_admin_color_scheme' );
}
