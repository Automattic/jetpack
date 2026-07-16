<?php
/**
 * Turn the Jetpack Podcast module on for Atomic sites.
 *
 * Podcast is available globally as a Jetpack module. Atomic temporarily forces
 * the module active so sites persist it in their `jetpack_active_modules`
 * setting as they receive requests, mirroring the previous always-on behavior.
 * The force-activation hook can be removed after the hydration window; the
 * stored setting will keep Podcast enabled while making it user-toggleable.
 *
 * @package wpcomsh
 */

/**
 * Force Podcast active while Atomic sites hydrate their stored module setting.
 *
 * @return void
 */
function wpcomsh_hydrate_podcast_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'podcast' ) ) {
		Jetpack::activate_module( 'podcast', false, false );
	}
}
add_action( 'init', 'wpcomsh_hydrate_podcast_module', 0, 0 );
