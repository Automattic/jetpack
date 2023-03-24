<?php
/**
 * Critical CSS Invalidator
 *
 * Reset critical CSS when existing critical css values are stale.
 */
namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS_Followup;

/**
 * Handler for invalidating Critical CSS; both Cloud and Local. Watches relevant
 * hooks and clears data when necessary. Also sends out its own action
 * (after_critical_css_invalidate) so that the Cloud or Local implementations of
 * Critical CSS can respond to the invalidation.
 */
class Critical_CSS_Invalidator {
	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'jetpack_boost_deactivate', array( __CLASS__, 'clear_data' ) );
		add_action( 'handle_environment_change', array( __CLASS__, 'handle_environment_change' ) );
	}

	/**
	 * Clear Critical CSS data.
	 */
	public static function clear_data() {
		$storage = new Critical_CSS_Storage();
		$storage->clear();

		$state = new Critical_CSS_State();
		$state->clear();

		Cloud_CSS_Followup::unschedule();
	}

	/**
	 * Respond to environment changes; deciding whether or not to clear Critical CSS data.
	 */
	public static function handle_environment_change( $is_major_change ) {
		if ( $is_major_change ) {
			self::clear_data();

			do_action( 'critical_css_invalidated' );
		}
	}

}
