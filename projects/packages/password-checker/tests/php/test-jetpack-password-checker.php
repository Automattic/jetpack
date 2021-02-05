<?php
/**
 * Tests the Jetpack_Password_Checker package.
 *
 * @package automattic/jetpack-password-checker
 */

use Automattic\Jetpack\Jetpack_Password_Checker;
use Brain\Monkey;
use PHPUnit\Framework\TestCase;

/**
 * Test Jetpack_Password_Checker class
 */
class Jetpack_Password_Checker_Test extends TestCase {

	/**
	 * Sets up the test.
	 *
	 * @before
	 */
	public function set_up() {
		if ( ! defined( 'JETPACK__VERSION' ) ) {
			define( 'JETPACK__VERSION', '7.5' );
		}
		Monkey\setUp();
		Monkey\Functions\stubs( array( '__' => null ) );
	}

	/**
	 * Tears down the test.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}

	/**
	 * Test the password checker.
	 */
	public function test_password() {
		$password_checker = new Jetpack_Password_Checker( null );

		$test_results = $password_checker->test( '123', true );
		$this->assertFalse( $test_results['passed'] );

		$test_results = $password_checker->test( 'password', true );
		$this->assertTrue( $test_results['passed'] );
	}
}
