<?php
/**
 * Gutenberg's Block Theme Previews feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Always show the correct homepage when previewing a theme in the Site Editor
 *
 * @see https://github.com/Automattic/wp-calypso/issues/79221
 * @since 12.4
 */
add_filter(
	'option_show_on_front',
	function ( $value ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! empty( $_GET['wp_theme_preview'] ) ) {
				return 'posts';
		}
		return $value;
	}
);
