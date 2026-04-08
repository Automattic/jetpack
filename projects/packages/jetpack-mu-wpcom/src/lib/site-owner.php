<?php
/**
 * Site owner resolution helpers.
 *
 * Works on Simple sites (via wpcom_get_blog_owner), Atomic/WoW sites
 * (via Jetpack connection master_user), and gracefully returns defaults
 * on self-hosted.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Get the site/plan owner's user ID.
 *
 * - Simple sites: delegates to wpcom_get_blog_owner().
 * - Atomic sites: reads the Jetpack connection master_user option.
 * - Self-hosted: returns 0.
 *
 * @return int Owner user ID, or 0 if unavailable.
 */
function wpcom_get_site_owner_id() {
	// Simple sites: wpcom_get_blog_owner is the canonical source.
	if ( function_exists( 'wpcom_get_blog_owner' ) ) {
		return (int) wpcom_get_blog_owner( get_wpcom_blog_id() );
	}

	// Atomic sites: the Jetpack connection master_user is the plan owner.
	if ( class_exists( 'Jetpack_Options' ) ) {
		$master_user = \Jetpack_Options::get_option( 'master_user' );
		if ( $master_user ) {
			return (int) $master_user;
		}
	}

	return 0;
}

/**
 * Check if the current user is the site/plan owner.
 *
 * @return bool True if the current user is the owner, false otherwise.
 */
function wpcom_is_site_owner() {
	$owner_id = wpcom_get_site_owner_id();
	if ( ! $owner_id ) {
		return false;
	}
	return get_current_user_id() === $owner_id;
}
