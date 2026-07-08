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
 * Seed the Podcast module into existing sites' active modules, once.
 *
 * `Auto Activate` only reaches new installs, so existing Atomic sites need a
 * one-time nudge to turn Podcast on. We add it to the stored active-modules
 * option (rather than forcing it via a filter) so the module stays on but
 * remains user-toggleable. A per-site flag guards the seed, so a later manual
 * deactivation sticks — we never re-add it.
 *
 * @return void
 */
function wpcomsh_seed_podcast_module() {
	if ( get_option( 'wpcomsh_podcast_module_seeded' ) ) {
		return;
	}

	if ( ! class_exists( 'Jetpack_Options' ) ) {
		return;
	}

	$active = Jetpack_Options::get_option( 'active_modules', array() );
	if ( ! is_array( $active ) ) {
		$active = array();
	}

	if ( ! in_array( 'podcast', $active, true ) ) {
		$active[] = 'podcast';
		Jetpack_Options::update_option( 'active_modules', $active );
	}

	update_option( 'wpcomsh_podcast_module_seeded', 1 );
}
add_action( 'jetpack_loaded', 'wpcomsh_seed_podcast_module' );
