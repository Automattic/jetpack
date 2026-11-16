<?php
/**
 * Keeps the Jetpack random redirect opt-out working with WordPress core's random content redirects.
 *
 * @package automattic/jetpack
 */

/**
 * Turns off core's random content redirects when the Jetpack filter does.
 *
 * @since $$next-version$$
 *
 * @param bool $enabled Whether core's random content redirects are enabled.
 * @return bool
 */
function jetpack_random_redirect_core_compat( $enabled ) {
	/** This filter is documented in modules/theme-tools/random-redirect.php */
	return $enabled && apply_filters( 'jetpack_random_redirect_enabled', true );
}
add_filter( 'wp_enable_random_content_redirect', 'jetpack_random_redirect_core_compat' );
