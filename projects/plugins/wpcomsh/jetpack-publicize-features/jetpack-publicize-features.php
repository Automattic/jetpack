<?php
/**
 * Enables features that are required by the Jetpack Publicize module.
 *
 * @package wpcomsh
 */

/**
 * Ensures the theme rest API reports that the `post-thumbnail` feature is supported
 * when the Jetpack Publicize module is enabled. This ensures the featured image UI
 * appears in the editor, even when the theme doesn't display features images.
 *
 * Used with the 'rest_prepare_theme' filter.
 *
 * @param array $response The original theme API response.
 * @return array The potentially modified theme API response.
 */
function wpcomsh_filter_post_thumbnails_support( $response ) {
	$data = $response->get_data();
	if (
		! $data['theme_supports']['post-thumbnails'] &&
		wpcomsh_is_publicize_enabled()
	) {
		$data['theme_supports']['post-thumbnails'] = true;
		$response->set_data( $data );
	}
	return $response;
}
add_filter( 'rest_prepare_theme', 'wpcomsh_filter_post_thumbnails_support' );

/**
 * Returns true if the Jetpack Publicize feature is currently enabled.
 *
 * @return bool
 */
function wpcomsh_is_publicize_enabled() {
	return get_option( 'jetpack_publicize' ) || in_array( 'publicize', get_option( 'jetpack_active_modules', array() ), true );
}
