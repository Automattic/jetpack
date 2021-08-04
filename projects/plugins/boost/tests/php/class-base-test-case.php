<?php //phpcs:ignoreFile

namespace Automattic\Jetpack_Boost\Tests;

use Brain\Monkey;

require_once __DIR__ . '/mocks.php';

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', __DIR__ . '/../..' );
}

/**
 * Class Base_Test_Case
 *
 * @package Automattic\Jetpack_Boost\Tests
 */
abstract class Base_Test_Case extends \PHPUnit\Framework\TestCase {
	/**
	 * Setup.
	 */
	protected function setUp() {
		parent::setUp();
		Monkey\setUp();

		add_filter(
			'jetpack_boost_module_enabled',
			function ( $enabled, $module_slug ) {
				// force-enable critical CSS
				if ( 'critical-css' === $module_slug ) {
					return true;
				}
				return $enabled;
			},
			10,
			2
		);
	}

	/**
	 * Teardown.
	 */
	protected function tearDown() {
		Monkey\tearDown();
	}
}
