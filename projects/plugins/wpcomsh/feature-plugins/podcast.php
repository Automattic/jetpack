<?php
/**
 * Force-activate the Jetpack Podcast module on Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Add the Podcast module to Jetpack's active modules.
 *
 * The filter runs after Jetpack intersects active with available modules, so
 * this keeps Podcast active even while it stays hidden from the available list.
 *
 * @param array $modules The current Jetpack active modules.
 *
 * @return array
 */
function wpcomsh_activate_podcast_module( $modules ) {
	if ( ! in_array( 'podcast', $modules, true ) ) {
		$modules[] = 'podcast';
	}

	return $modules;
}
add_filter( 'jetpack_active_modules', 'wpcomsh_activate_podcast_module' );
