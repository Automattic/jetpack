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
		return self::is_enabled_for_blog( self::resolve_blog_id() );
	}

	/**
	 * Resolve the WP.com blog ID to bucket on.
	 *
	 * On Atomic, `get_current_blog_id()` returns the *local* blog ID, which is
	 * 1 on every single-site install — bucketing on it gives the whole fleet
	 * one shared bucket, so any percentage below that bucket enrolls nobody and
	 * any percentage above it enrolls everybody. The WP.com blog ID lives in
	 * the `jetpack_options` option; read it directly (no `Jetpack_Options`
	 * dependency) and return 0 when it's absent, so a site we can't attribute
	 * stays out of the cohort instead of piling into bucket 0.
	 *
	 * @return int WP.com blog ID, or 0 when it can't be determined.
	 */
	public static function resolve_blog_id() {
		// WP.com Simple: the current blog ID *is* the WP.com blog ID.
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			return (int) get_current_blog_id();
		}

		$jetpack_options = get_option( 'jetpack_options' );
		if ( is_array( $jetpack_options ) && ! empty( $jetpack_options['id'] ) ) {
			return (int) $jetpack_options['id'];
		}

		return 0;
	}

	/**
	 * Bucketing is stable, so raising the percentage only ever adds blogs.
	 *
	 * @param int $blog_id WP.com blog ID under test.
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
