<?php
/**
 * Stands in for the Premium Analytics package, which My Jetpack does not depend on.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Mock of the package's main class.
 */
class Analytics {

	/**
	 * Whether a host booted the dashboard.
	 *
	 * @var bool
	 */
	public static $mock_initialized = false;

	/**
	 * Mirrors the package method.
	 *
	 * @return bool
	 */
	public static function is_initialized() {
		return self::$mock_initialized;
	}
}
