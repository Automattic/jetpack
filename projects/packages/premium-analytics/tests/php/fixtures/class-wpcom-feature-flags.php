<?php
/**
 * Test fixture.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Stand-in for jetpack-mu-wpcom's Automattician gate. Load it only in a process-isolated test:
 * once declared, every later test in the process would see a WordPress.com site.
 */
class Wpcom_Feature_Flags {

	/**
	 * What is_a11n() answers.
	 *
	 * @var bool
	 */
	public static $is_a11n = false;

	/**
	 * Whether the current visitor is an Automattician.
	 *
	 * @return bool
	 */
	public static function is_a11n() {
		return self::$is_a11n;
	}
}
