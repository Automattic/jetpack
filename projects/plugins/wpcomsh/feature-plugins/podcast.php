<?php
/**
 * Turn the Jetpack Podcast module on for Atomic sites.
 *
 * Podcast ships as a Jetpack module that older Jetpack builds still hide behind
 * the `jetpack_podcast_for_the_world` filter. The Jetpack plugin currently
 * pinned on Atomic predates the self-hosted release (#50447) that removes that
 * gate, so wpcomsh keeps opting Atomic in — otherwise the module drops out of
 * the available list entirely. We also force it active so existing sites, which
 * do not auto-activate the module on upgrade, persist it in their stored
 * `jetpack_active_modules` setting. Remove both once the Jetpack build on Atomic
 * includes #50447; the stored setting keeps Podcast on and user-toggleable.
 *
 * @package wpcomsh
 */

// Un-hide Podcast on Jetpack builds that still gate it. Registered at
// mu-plugin load so it is in place before get_available_modules() first runs.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );

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
