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

	/**
	 * Off by default; wpcomsh sets the live percentage.
	 */
	const DEFAULT_PERCENTAGE = 0;

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
		// Simple sites can't install plugins, so there's nothing to guard.
		if ( ! \Automattic\Jetpack\Constants::is_true( 'IS_ATOMIC' ) ) {
			return false;
		}
		return self::is_enabled_for_blog( (int) get_wpcom_blog_id() );
	}

	/**
	 * Bucketing is stable, so raising the percentage only ever adds blogs.
	 *
	 * @param int $blog_id WP.com blog ID under test.
	 * @return bool
	 */
	public static function is_enabled_for_blog( $blog_id ) {
		$percentage = (int) apply_filters( 'pcg_rollout_percentage', self::DEFAULT_PERCENTAGE );
		if ( $percentage <= 0 ) {
			return false;
		}
		if ( $percentage >= 100 ) {
			return true;
		}

		// A partial rollout needs a real ID to bucket on.
		$blog_id = (int) $blog_id;
		if ( $blog_id <= 0 ) {
			return false;
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
