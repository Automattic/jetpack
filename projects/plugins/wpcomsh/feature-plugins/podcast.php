<?php
/**
 * Turn the Jetpack Podcast module on for Atomic sites.
 *
 * Podcast ships as a Jetpack module that Jetpack hides (and leaves inactive)
 * on self-hosted sites until go-live. On Atomic we want it to behave like any
 * other default module (e.g. Newsletter): on by default, but user-toggleable.
 *
 * @package wpcomsh
 */

// Un-hide the module so it's a normal, toggleable module and new sites pick it
// up via its `Auto Activate` header.
add_filter( 'jetpack_podcast_for_the_world', '__return_true' );

/**
 * Activate Podcast on existing sites, once.
 *
 * Mirrors how wpcomsh activates other modules (see blaze.php,
 * wpcom-reader-link.php), but guarded by a one-time flag instead of
 * re-activating on every request — so a later manual deactivation sticks and
 * the module stays user-toggleable. `Auto Activate` covers new installs.
 *
 * @return void
 */
function wpcomsh_seed_podcast_module() {
	if ( get_option( 'wpcomsh_podcast_module_seeded' ) ) {
		return;
	}

	if ( ! defined( 'JETPACK__VERSION' ) || ! class_exists( 'Jetpack' ) ) {
		return;
	}

	// Set the flag only once Podcast is confirmed active, so a transient
	// activation failure retries on the next request rather than seeding never.
	if ( Jetpack::is_module_active( 'podcast' ) || Jetpack::activate_module( 'podcast', false, false ) ) {
		update_option( 'wpcomsh_podcast_module_seeded', 1 );
	}
}
add_action( 'init', 'wpcomsh_seed_podcast_module' );
