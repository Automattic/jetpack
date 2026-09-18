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
	 * Blog IDs this mock reports as being on the pre-2026 gating. Tests set it and reset it.
	 *
	 * @var int[]
	 */
	public static $legacy_gating_blog_ids = array();

	/**
	 * Mock the pre-2026 gating predicate, which on WordPress.com ranks two stickers against a blog
	 * ID cutoff.
	 *
	 * @param int $blog_id Blog ID being asked about.
	 *
	 * @return bool
	 */
	public static function is_legacy_gating_site( $blog_id ) {
		return in_array( (int) $blog_id, self::$legacy_gating_blog_ids, true );
	}
}
