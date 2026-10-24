<?php
/**
 * Turns the Jetpack AI module on, once, for sites transferred from Simple before the
 * transfer seeded it. Delete this file and its require once the window has been covered.
 *
 * @package wpcomsh
 */

/**
 * Sites below this got the module from the 16.2-a.3 upgrade (ATOMIC-1187, 25 Aug 2026).
 *
 * @return int
 */
function wpcomsh_jetpack_ai_module_seed_min_site_id() {
	return 152102830;
}

/**
 * Sites above this were seeded at transfer by wpcom #247252 (7 Oct 2026).
 *
 * @return int
 */
function wpcomsh_jetpack_ai_module_seed_max_site_id() {
	return 152227154;
}

/**
 * Activate the AI module once per site. A disconnected site or a refused activation
 * leaves no marker and retries later; a reported activation is final.
 *
 * @param int|null $client_id Atomic client ID. Defaults to the site's own.
 * @param int|null $site_id   Atomic site ID. Defaults to the site's own.
 */
function wpcomsh_seed_jetpack_ai_module( $client_id = null, $site_id = null ) {
	if ( null === $client_id ) {
		$client_id = wpcomsh_get_atomic_client_id();
	}
	if ( null === $site_id ) {
		$site_id = wpcomsh_get_atomic_site_id();
	}

	// WoA only: e2e and Jurassic Ninja sites test the module's enforcement.
	if ( WPCOMSH_WPCOM_ATOMIC_CLIENT_ID !== (int) $client_id ) {
		return;
	}

	$site_id = (int) $site_id;
	if ( $site_id < wpcomsh_jetpack_ai_module_seed_min_site_id() || $site_id > wpcomsh_jetpack_ai_module_seed_max_site_id() ) {
		return;
	}

	if ( get_option( 'wpcomsh_jetpack_ai_module_seeded' ) ) {
		return;
	}

	if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_connection_ready() ) {
		return;
	}

	// A filter can hide the module after a successful activation; that is an override to respect, not a retry.
	if ( Jetpack::is_module_active( 'ai' ) || Jetpack::activate_module( 'ai', false, false ) ) {
		update_option( 'wpcomsh_jetpack_ai_module_seeded', true );
	}
}
add_action( 'init', 'wpcomsh_seed_jetpack_ai_module', 0, 0 );
