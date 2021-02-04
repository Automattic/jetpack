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
	 * Test add and get_current_status methods
	 */
	public function test_password() {
		$password_checker = new Jetpack_Password_Checker( null );

		$test_results = $password_checker->test( 'password', true );

		// If the password passes tests, we don't do anything.
		if ( empty( $test_results['test_results']['failed'] ) ) {
			return true;
		}

		return $test_results;
	}
}
