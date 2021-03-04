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
	 * Password_Checker object.
	 *
	 * @var Password_Checker
	 */
	private $password_checker;

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

		$this->password_checker = new Password_Checker( $this->user );
	}

	/**
	 * Test the password checker.
	 *
	 * @dataProvider rule_provider
	 *
	 * @param string $rule            Rule name.
	 * @param string $password        The password.
	 * @param bool   $expected_result The expected result.
	 * @param string $output_message  The output message.
	 */
	public function test_password( $rule, $password, $expected_result, $output_message ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$tests = apply_filters( 'password_checker_tests', array() ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$results = $this->password_checker->test( $password, true );
		$this->assertSame( $expected_result, $results['passed'] );
	}

	/**
	 * Data provider for password tests.
	 *
	 * @return array
	 */
	public function rule_provider() {
		/**
		 * Data format.
		 *
		 * Param 1 -> rule
		 * Param 2 -> password
		 * Param 3 -> expected_result
		 * Param 4 -> output_message
		 */

		return array(
			'no_backslashes'   => array(
				'no_backslashes',
				'abc\123',
				false,
				'Passwords may not contain the character "\".',
			),
			'minimum_length'   => array(
				'minimum_length',
				'abc12',
				false,
				'Password must be at least 6 characters.',
			),
			'has_mixed_case'   => array(
				'has_mixed_case',
				'abc123',
				false,
				'Password must have mixed case characters.',
			),
			'has_digit'        => array(
				'has_digit',
				'abcdef',
				false,
				'Password must have digits.',
			),
			'has_special_char' => array(
				'has_special_char',
				'abcdef',
				false,
				'Password must have special characters.',
			),
		);
	}
}
