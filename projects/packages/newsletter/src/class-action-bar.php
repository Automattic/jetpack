<?php
/**
 * Loads the WordPress.com front-end Action Bar.
 *
 * @package automattic/jetpack-newsletter
 */

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Status\Host;

/**
 * Load the floating Action Bar on the front end of WordPress.com Simple sites.
 */
class Action_Bar {
	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Queue the Action Bar to load once all plugins are available.
	 *
	 * Simple only for now. Yields to the copy wpcom still ships in mu-plugins, so the two never load together.
	 *
	 * @since $$next-version$$
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		if ( ! ( new Host() )->is_wpcom_simple() ) {
			return;
		}

		// A callback added to the hook that is currently running never fires.
		if ( did_action( 'plugins_loaded' ) ) {
			self::load();
		} else {
			add_action( 'plugins_loaded', array( __CLASS__, 'load' ) );
		}
	}

	/**
	 * Include the feature file unless wpcom already defines the bar.
	 *
	 * @since $$next-version$$
	 */
	public static function load() {
		if ( function_exists( 'wpcom_actionbar_enqueue_scripts' ) ) {
			return;
		}
		require_once __DIR__ . '/action-bar/action-bar.php';
	}
}
