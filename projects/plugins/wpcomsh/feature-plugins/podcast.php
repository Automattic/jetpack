<?php
/**
 * Force the Jetpack Podcast module on for Atomic sites.
 *
 * @package wpcomsh
 */

/**
 * Add the Podcast module to Jetpack's active modules.
 *
 * The filter runs after Jetpack intersects active with available modules, so
 * this forces Podcast on for every Atomic site (existing and new) regardless of
 * stored state, and keeps it on even though the module stays hidden from the
 * available list.
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
