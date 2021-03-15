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
	 * @param string $section         Section name.
	 * @param string $rule            Rule name.
	 * @param string $password        The password.
	 * @param bool   $expected_result The expected result.
	 * @param string $output_message  The output message.
	 */
	public function test_password( $section, $rule, $password, $expected_result, $output_message ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->password_checker->common_passwords = array( 'password' );

		$tests = $this->password_checker->get_tests( $section );

		$results = $this->password_checker->run_tests( $password, array( $section => array( $rule => $tests[ $section ][ $rule ] ) ) );

		$this->assertSame( $expected_result, ! empty( $results['passed'] ), $output_message );
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
		 * Param 1 -> section
		 * Param 2 -> rule
		 * Param 3 -> password
		 * Param 4 -> expected_result
		 * Param 5 -> output_message
		 */

		return array(
			'no_backslashes'    => array(
				'preg_match',
				'no_backslashes',
				'abc123',
				true,
				'Passwords may not contain the character "\".',
			),
			'minimum_length'    => array(
				'preg_match',
				'minimum_length',
				'abc123',
				true,
				'Password must be at least 6 characters.',
			),
			'has_mixed_case'    => array(
				'preg_match',
				'has_mixed_case',
				'Abc123',
				true,
				'Password must have mixed case characters.',
			),
			'has_digit'         => array(
				'preg_match',
				'has_digit',
				'abc123',
				true,
				'Password must have digits.',
			),
			'has_special_char'  => array(
				'preg_match',
				'has_special_char',
				'abc!def',
				true,
				'Password must have special characters.',
			),
			'compare_to_list_1' => array(
				'compare_to_list',
				'not_a_common_password',
				'password',
				false,
				'Common passwords that should not be used.',
			),
			'compare_to_list_2' => array(
				'compare_to_list',
				'not_a_common_password',
				'hunter2',
				true,
				'Common passwords that should not be used.',
			),
			'compare_to_list_3' => array(
				'compare_to_list',
				'not_same_as_other_user_data',
				'test-user',
				false,
				'Password contains user data.',
			),
		);
	}
}
