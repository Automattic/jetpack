<?php
/**
 * Percentage-based rollout gate for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Percentage rollout gate for PCG.
 */
class PCG_Rollout {

	const DEFAULT_PERCENTAGE = 20;

	/**
	 * Priority 100 leaves room for emergency overrides at higher priorities.
	 */
	public static function init() {
		add_filter( 'pcg_guard_activation', array( __CLASS__, 'gate' ), 100 );
		add_filter( 'pcg_guard_updates', array( __CLASS__, 'gate' ), 100 );
	}

	/**
	 * Only narrows.
	 *
	 * @param bool $enabled Previous filter value.
	 * @return bool
	 */
	public static function gate( $enabled ) {
		if ( ! $enabled ) {
			return $enabled;
		}
		return self::is_enabled_for_blog( get_current_blog_id() );
	}

	/**
	 * On single-site, `get_current_blog_id()` is always 1, so the site is
	 * wholly in or wholly out at any given percentage.
	 *
	 * @param int $blog_id Blog ID under test.
	 * @return bool
	 */
	public static function is_enabled_for_blog( $blog_id ) {
		$blog_id = (int) $blog_id;
		if ( $blog_id <= 0 ) {
			return false;
		}

		$percentage = (int) apply_filters( 'pcg_rollout_percentage', self::DEFAULT_PERCENTAGE );
		if ( $percentage <= 0 ) {
			return false;
		}
		if ( $percentage >= 100 ) {
			return true;
		}

		return self::blog_bucket( $blog_id ) < $percentage;
	}

	/**
	 * `abs()` on the modulo result (not raw `crc32`) — 32-bit PHP returns
	 * a signed int and `abs(PHP_INT_MIN)` overflows.
	 *
	 * @internal Exposed for tests.
	 * @param int $blog_id Blog ID.
	 * @return int
	 */
	public static function blog_bucket( $blog_id ) {
		return abs( crc32( (string) (int) $blog_id ) % 100 );
	}
}

PCG_Rollout::init();
