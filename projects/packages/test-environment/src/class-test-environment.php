<?php
/**
 * Provides a shared WordPress test environment for Jetpack packages
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

/**
 * Provides a shared WordPress test environment for Jetpack packages.
 * This ensures WordPress is only loaded once across all packages using this environment.
 */
class Test_Environment {

	const PACKAGE_VERSION = '1.0.0-alpha';

	/**
	 * Initialize the shared WordPress test environment.
	 *
	 * This ensures we only load WordPress once across all packages.
	 */
	public static function init() {
		if ( ! defined( 'WORDBLESS_RUNNING' ) ) {
			require_once dirname( __DIR__ ) . '/vendor/autoload.php';
			\WorDBless\Load::load();
		}
	}
}
