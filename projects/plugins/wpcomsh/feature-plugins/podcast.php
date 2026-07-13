<?php
/**
 * Turn the Jetpack Podcast module on for Atomic sites.
 *
 * Podcast ships as a Jetpack module that Jetpack hides on self-hosted sites
 * until go-live. On Atomic we opt in early and force the module active so every
 * site hydrates its stored `jetpack_active_modules` setting — mirroring today's
 * always-on behavior. Removing this file at self-hosted go-live leaves the
 * hydrated setting in place, so sites stay on but the module becomes
 * user-toggleable.
 *
 * @package wpcomsh
 */

// Opt Atomic into the module: un-hides it, and new sites pick it up via its
// `Auto Activate` header.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );

/**
 * Force Podcast active so every Atomic site hydrates its stored module setting.
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
