<?php
/**
 * Critical CSS Invalidator
 *
 * Reset critical CSS when existing critical css values are stale.
 */
namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

class Critical_CSS_Invalidator {
	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'jetpack_boost_clear_cache', array( __CLASS__, 'clear_all' ) );
		add_action( 'handle_theme_change', array( __CLASS__, 'clear_all' ) );
	}

	/**
	 * Clear Critical CSS.
	 */
	public static function clear_all() {
		// Mass invalidate all cached values.
		// ^^ Not true anymore. Mass invalidate __some__ cached values.
		$storage = new Critical_CSS_Storage();
		$storage->clear();
		Critical_CSS_State::reset();
	}

}
