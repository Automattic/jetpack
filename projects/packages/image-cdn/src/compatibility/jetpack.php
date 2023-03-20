<?php
/**
 * Unhook Jetpack Photon related functions
 * to avoid executing the same code twice.
 *
 * @package automattic/jetpack-image-cdn
 */

remove_filter( 'jetpack_photon_url', 'jetpack_photon_url', 10, 3 );

remove_filter( 'jetpack_photon_pre_args', 'jetpack_photon_parse_wpcom_query_args', 10, 2 );

remove_filter( 'jetpack_photon_skip_for_url', 'jetpack_photon_banned_domains', 9, 2 );

remove_filter( 'widget_text', 'jetpack_photon_support_text_widgets' );

add_filter( 'jetpack_active_modules', 'jetpack_image_cdn_disable_photon' );

/**
 * Check if Jetpack Photon is enabled and disable it.
 *
 * @param array $modules A list of Jetpack module slugs.
 *
 * @return array $modules
 */
function jetpack_image_cdn_disable_photon( $modules ) {
	if ( in_array( 'photon', $modules, true ) ) {
		unset( $modules[ array_search( 'photon', $modules, true ) ] );

		// Reset keys. Let's keep the array neat.
		$modules = array_values( $modules );
	}

	return $modules;
}
