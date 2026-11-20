<?php
/**
 * WPCOM_Features file.
 *
 * @package Jetpack
 */

if ( class_exists( 'WPCOM_Features' ) ) {
	return;
}

/**
 * Class WPCOM_Features.
 */
class WPCOM_Features {
	const ATOMIC             = 'atomic';
	const EMAIL_SUBSCRIPTION = 'email-subscription';
	const MANAGE_PLUGINS     = 'manage-plugins';

	/**
	 * Mock the pre-2026 gating predicate, which on WordPress.com ranks two stickers against a blog
	 * ID cutoff. Tests set the option; Phan excludes this file, so they cannot reach a member here.
	 *
	 * @param int $blog_id Blog ID being asked about.
	 *
	 * @return bool
	 */
	public static function is_legacy_gating_site( $blog_id ) {
		$legacy_blog_ids = array_map( 'intval', (array) get_option( 'jetpack_test_legacy_gating_blog_ids', array() ) );

		return in_array( (int) $blog_id, $legacy_blog_ids, true );
	}
}
