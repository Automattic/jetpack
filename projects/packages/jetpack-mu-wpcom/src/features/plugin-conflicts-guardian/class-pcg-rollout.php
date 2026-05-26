<?php
/**
 * Percentage-based rollout gate for the Plugin Conflicts Guardian.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Decides whether PCG fires for the current blog, given a configurable
 * percentage rollout and an optional force-enable list. Wires into the
 * existing `pcg_guard_activation` / `pcg_guard_updates` filters so the
 * activation guard, post-update healthcheck, and probe endpoint all see
 * consistent gating without each having to consult Rollout directly.
 *
 * Default is 0% — PCG is off everywhere until the operator opts in. The
 * #49108 disable removed the feature from `load_features()` entirely; this
 * gate is what lets a re-enable land safely behind a percentage roll-up.
 */
class PCG_Rollout {

	const DEFAULT_PERCENTAGE = 0;

	/**
	 * Register the gate against the existing per-mode filters.
	 *
	 * Late priority (100) so emergency-override hooks at higher priorities
	 * can still flip the verdict either way.
	 */
	public static function init() {
		add_filter( 'pcg_guard_activation', array( __CLASS__, 'gate' ), 100 );
		add_filter( 'pcg_guard_updates', array( __CLASS__, 'gate' ), 100 );
	}

	/**
	 * Filter callback. Only narrows — if an earlier filter already said
	 * `false`, we leave it alone.
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
	 * Whether PCG should fire for the given blog under the current rollout.
	 *
	 * Bucketing uses crc32 of the blog ID so a blog stays in the same
	 * bucket for the duration of a given percentage tier — ramping from
	 * 10% to 50% strictly adds blogs, never reshuffles them. Force-enable
	 * is consulted first so test blogs can opt in regardless of bucket.
	 *
	 * @param int $blog_id Blog ID under test (usually `get_current_blog_id()`).
	 * @return bool
	 */
	public static function is_enabled_for_blog( $blog_id ) {
		$blog_id = (int) $blog_id;
		if ( $blog_id <= 0 ) {
			return false;
		}

		$force = apply_filters( 'pcg_rollout_force_enable_blogs', array() );
		if ( is_array( $force ) ) {
			foreach ( $force as $entry ) {
				if ( (int) $entry === $blog_id ) {
					return true;
				}
			}
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
	 * Stable [0, 100) bucket for a blog ID.
	 *
	 * @internal Exposed for tests.
	 * @param int $blog_id Blog ID.
	 * @return int
	 */
	public static function blog_bucket( $blog_id ) {
		return abs( crc32( (string) (int) $blog_id ) ) % 100;
	}
}

PCG_Rollout::init();
