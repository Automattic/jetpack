<?php
/**
 * Force-activate the Jetpack Podcast module on Atomic sites.
 *
 * The Podcast feature ships as a Jetpack module that is hidden and inactive by
 * default on self-hosted sites. WordPress.com sites should always have it on,
 * so we add it to the active-modules list here, mirroring how wpcomsh toggles
 * other modules. Simple sites are covered separately: Modules::is_active()
 * short-circuits to true when IS_WPCOM is set.
 *
 * @package wpcomsh
 */

/**
 * Add the Podcast module to Jetpack's active modules.
 *
 * The jetpack_active_modules filter runs after Jetpack intersects the stored
 * active modules with the available ones, so adding 'podcast' here keeps the
 * module active even though it stays hidden from the available list.
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
