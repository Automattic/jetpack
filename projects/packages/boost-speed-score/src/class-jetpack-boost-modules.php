<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Jetpack Boost Active Modules
 *
 * Since the speed scores API will be used in the Jetpack plugin and in the My Jetpack, if Jetpack Boost
 * is uninstalled, all we need is to pass along this placeholder class for the modules that essentially
 * tells the API the user doesn't have any Boost modules active.
 *
 * @package automattic/jetpack/boost_speed_score
 */
namespace Automattic\Jetpack\Boost_Speed_Score;

/**
 * Jetpack Boost Modules
 */
class Jetpack_Boost_Modules {

	/**
	 * Holds the singleton instance of the class
	 *
	 * @var Jetpack_Boost_Modules
	 */
	private static $instance = false;

	/**
	 * Singleton
	 *
	 * @static
	 * @return Jetpack_Boost_Modules
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Jetpack_Boost_Modules();
		}

		return self::$instance;
	}
	/**
	 * Returns status of all active boost modules
	 *
	 * @return array - An empty array. The user will never have active modules when using the Boost Score API
	 */
	public function get_status() {
		return array();
	}

	/**
	 * Returns whether or not the user has active modules
	 *
	 * @return false - The user will never have active modules when using the Boost Score API
	 */
	public function have_enabled_modules() {
		return false;
	}
}
