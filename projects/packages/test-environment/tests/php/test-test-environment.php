<?php
/**
 * Test the Test_Environment class
 *
 * @package automattic/jetpack-test-environment
 */

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * Test the Test_Environment class
 */
class Test_Environment_Test extends BaseTestCase {
	/**
	 * Test that WordPress functions are available after init
	 */
	public function test_wordpress_functions_available() {
		$this->assertTrue( function_exists( 'add_action' ) );
		$this->assertTrue( function_exists( 'do_action' ) );
		$this->assertTrue( defined( 'ABSPATH' ) );
	}
}
