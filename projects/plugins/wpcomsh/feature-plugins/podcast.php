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
// Runs on plugins_loaded before Jetpack's late_initialization (priority 90),
// which only calls Podcast::init() when the module already reads as active.
// Activating on init (after plugins_loaded) lost that race: the menu still
// rendered but the dashboard fell back to an empty container.
add_action( 'plugins_loaded', 'wpcomsh_hydrate_podcast_module', 20 );
