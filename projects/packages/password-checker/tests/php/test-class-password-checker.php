<?php
/**
 * Tests the Password_Checker package.
 *
 * @package automattic/jetpack-password-checker
 */

namespace Automattic\Jetpack;

use WorDBless\BaseTestCase;

/**
 * Test Password_Checker class
 */
class Password_Checker_Test extends BaseTestCase {

	/**
	 * Test the password checker.
	 */
	public function test_password() {
		$password_checker = new Password_Checker( null );

		$test_results = $password_checker->test( '123', true );
		$this->assertFalse( $test_results['passed'] );

		$test_results = $password_checker->test( 'password', true );
		$this->assertTrue( $test_results['passed'] );
	}
}
