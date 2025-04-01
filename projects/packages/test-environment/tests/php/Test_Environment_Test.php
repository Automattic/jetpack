<?php
/**
 * Test the Test_Environment class
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test the Test_Environment class
 */
class Test_Environment_Test extends TestCase {
	/**
	 * Test that WordPress functions are available after init.
	 */
	public function test_wordpress_functions_available() {
		Test_Environment::init();
		$this->assertTrue( \function_exists( 'add_action' ) );
		$this->assertTrue( \function_exists( 'do_action' ) );
		$this->assertTrue( \defined( 'ABSPATH' ) );
	}
}
