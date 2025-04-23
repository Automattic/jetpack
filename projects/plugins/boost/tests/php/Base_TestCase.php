<?php

namespace Automattic\Jetpack_Boost\Tests;

use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\After;
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

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

		$this->apply_mocks();

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

	protected function mock_module_status( $statuses ) {
		Functions\when( 'get_option' )->alias(
			function ( $option_name ) use ( $statuses ) {
				foreach ( $statuses as $module_slug => $status ) {
					if ( $option_name === 'jetpack_boost_status_' . str_replace( '_', '-', $module_slug ) ) {
						return $status;
					}
				}
				return null;
			}
		);
	}

	protected function apply_mocks() {
		require __DIR__ . '/mocks.php';
	}

	/**
	 * @after
	 */
	#[After]
	protected function tear_down() {
		Monkey\tearDown();
	}
}
