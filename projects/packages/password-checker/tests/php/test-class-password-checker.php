<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

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
	 * User ID.
	 *
	 * @var int|\WP_Error
	 */
	private $user_id;

	/**
	 * User object.
	 *
	 * @var \WP_User
	 */

	private $user;

	/**
	 * Initialize tests.
	 *
	 * @before
	 */
	public function set_up() {
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test-user',
				'user_pass'  => '123',
				'first_name' => 'Test',
				'last_name'  => 'User',
				'nickname'   => 'test',
				'role'       => 'subscriber',
			)
		);

		$this->user = new \WP_User( $this->user_id );
	}

	/**
	 * Test the password checker.
	 */
	public function test_password() {
		$password_checker = new Password_Checker( $this->user );

		$test_results = $password_checker->test( '123', true );
		$this->assertFalse( $test_results['passed'] );

		$test_results = $password_checker->test( 'password', true );
		$this->assertTrue( $test_results['passed'] );
	}
}
