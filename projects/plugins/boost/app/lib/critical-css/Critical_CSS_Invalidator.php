<?php
/**
 * Critical CSS Invalidator
 *
 * Reset critical CSS when existing critical css values are stale.
 */
namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS\Cloud_CSS_Cron;

class Critical_CSS_Invalidator {
	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'jetpack_boost_deactivate', array( __CLASS__, 'clear_data' ) );
		add_action( 'handle_environment_change', array( __CLASS__, 'handle_clear_cache' ) );
	}

	/**
	 * Clear Critical CSS data.
	 */
	public static function clear_data() {
		// Mass invalidate all cached values.
		// ^^ Not true anymore. Mass invalidate __some__ cached values.
		$storage = new Critical_CSS_Storage();
		$storage->clear();
		Critical_CSS_State::reset();
		Cloud_CSS_Cron::uninstall();
	}

	/**
	 * Clear cached data and trigger side effects.
	 */
	public static function handle_clear_cache() {
		self::clear_data();
		do_action( 'jetpack_boost_after_clear_cache' );
	}

}
