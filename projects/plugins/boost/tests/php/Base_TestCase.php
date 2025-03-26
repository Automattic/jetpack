<?php

namespace Automattic\Jetpack_Boost\Tests;

use Brain\Monkey;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

require_once __DIR__ . '/mocks.php';

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', __DIR__ . '/../..' );
}

/**
 * Class Base_TestCase
 *
 * @package Automattic\Jetpack_Boost\Tests
 */
abstract class Base_TestCase extends TestCase {
	protected function set_up() {
		Monkey\setUp();
		Monkey\Functions\stubEscapeFunctions();

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

	protected function tear_down() {
		Monkey\tearDown();
	}
}
