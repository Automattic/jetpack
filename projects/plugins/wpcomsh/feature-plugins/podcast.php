<?php
/**
 * Turn the Jetpack Podcast module on for Atomic sites.
 *
 * Podcast ships as a Jetpack module that Jetpack hides on self-hosted sites
 * until go-live. On Atomic we opt in early via `jetpack_podcast_for_the_world`
 * and, while that opt-in is on, keep the module force-activated so every site
 * hydrates its stored `active_modules` setting — mirroring today's always-on
 * behavior. When this opt-in is removed at self-hosted go-live, the hydrated
 * sites stay on but the module becomes user-toggleable.
 *
 * @package wpcomsh
 */

// Opt Atomic into the module: un-hides it, and new sites pick it up via its
// `Auto Activate` header.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );

/**
 * While Podcast is opted in for the whole world, force it active so the stored
 * module setting is hydrated on every site.
 *
 * Gating on the same `jetpack_podcast_for_the_world` filter ties the force-on to
 * the opt-in: removing the opt-in at go-live both un-forces the module and leaves
 * the hydrated setting in place, so users can toggle it from that point on.
 *
 * @return void
 */
function wpcomsh_hydrate_podcast_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	/** This filter is documented in class.jetpack.php */
	if ( ! apply_filters( 'jetpack_podcast_for_the_world', false ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'podcast' ) ) {
		Jetpack::activate_module( 'podcast', false, false );
	}
}
add_action( 'init', 'wpcomsh_hydrate_podcast_module' );
