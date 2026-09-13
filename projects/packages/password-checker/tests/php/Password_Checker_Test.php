<?php
/**
 * Tests the Password_Checker package.
 *
 * @package automattic/jetpack-password-checker
 */

namespace Automattic\Jetpack;

use PHPUnit\Framework\Attributes\DataProvider;
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
	#[DataProvider( 'rule_provider' )]
	public function test_password( $section, $rule, $password, $expected_result, $output_message ) {
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
	public static function rule_provider() {
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

	/**
	 * Test get_tests returns all tests or filtered sections.
	 */
	public function test_get_tests() {
		$all_tests = $this->password_checker->get_tests();
		$this->assertArrayHasKey( 'preg_match', $all_tests );
		$this->assertArrayHasKey( 'compare_to_list', $all_tests );

		$preg_tests = $this->password_checker->get_tests( 'preg_match' );
		$this->assertArrayHasKey( 'preg_match', $preg_tests );
		$this->assertArrayNotHasKey( 'compare_to_list', $preg_tests );

		$compare_tests = $this->password_checker->get_tests( 'compare_to_list' );
		$this->assertArrayHasKey( 'compare_to_list', $compare_tests );
		$this->assertArrayNotHasKey( 'preg_match', $compare_tests );

		$array_filtered = $this->password_checker->get_tests( array( 'preg_match' ) );
		$this->assertArrayHasKey( 'preg_match', $array_filtered );
		$this->assertArrayNotHasKey( 'compare_to_list', $array_filtered );

		$invalid_section = $this->password_checker->get_tests( 'non_existent_section' );
		$this->assertEmpty( $invalid_section );
	}

	/**
	 * Test high-level test() method with a strong password.
	 */
	public function test_test_method_strong_password() {
		$strong_password = 'Str0ng#P@ssw0rd!2026';
		$result          = $this->password_checker->test( $strong_password );

		$this->assertTrue( $result['passed'], 'Strong password should pass evaluation.' );
		$this->assertEmpty( $result['test_results']['failed'], 'Strong password should have zero failed tests.' );
		$this->assertNotEmpty( $result['test_results']['passed'], 'Strong password should record passed tests.' );
	}

	/**
	 * Test high-level test() method fails immediately on required condition violations.
	 */
	public function test_test_method_fails_required_condition() {
		// Backslash is a forbidden character (required check).
		$result = $this->password_checker->test( 'P@ssword\\123' );
		$this->assertFalse( $result['passed'], 'Password with backslash must fail evaluation.' );
		$this->assertNotEmpty( $result['test_results']['failed'], 'Failed tests list must not be empty.' );

		$failed_names = array_column( $result['test_results']['failed'], 'test_name' );
		$this->assertContains( 'no_backslashes', $failed_names );

		// Too short password (required check).
		$short_result = $this->password_checker->test( 'abc' );
		$this->assertFalse( $short_result['passed'], 'Short password must fail evaluation.' );
		$short_failed_names = array_column( $short_result['test_results']['failed'], 'test_name' );
		$this->assertContains( 'minimum_length', $short_failed_names );
	}

	/**
	 * Test high-level test() method flags low entropy passwords and includes suggestions.
	 */
	public function test_test_method_low_entropy_password() {
		$this->password_checker->common_passwords = array( 'password' );

		// Password meets minimum length 6 and not in common list, but fails entropy requirement.
		$result = $this->password_checker->test( 'zzzzzz' );
		$this->assertFalse( $result['passed'], 'Repetitive password must fail entropy requirement.' );
		$this->assertNotEmpty( $result['test_results']['failed'], 'Failed suggestion tests should be returned.' );
	}

	/**
	 * Test user data variations detection (suffix numbers, reversed username, etc.).
	 */
	public function test_user_data_variations() {
		$tests = $this->password_checker->get_tests( 'compare_to_list' );

		// Username with appended numbers should fail.
		$result_suffix = $this->password_checker->run_tests( 'test-user123', $tests );
		$this->assertNotEmpty( $result_suffix['failed'], 'Username with appended digits must fail.' );

		// Reversed username should fail.
		$result_reversed = $this->password_checker->run_tests( 'resu-tset', $tests );
		$this->assertNotEmpty( $result_reversed['failed'], 'Reversed username must fail.' );

		// Reversed username with appended numbers should fail.
		$result_reversed_suffix = $this->password_checker->run_tests( 'resu-tset99', $tests );
		$this->assertNotEmpty( $result_reversed_suffix['failed'], 'Reversed username with digits must fail.' );

		// First name with appended numbers should fail.
		$result_name_suffix = $this->password_checker->run_tests( 'Test2026', $tests );
		$this->assertNotEmpty( $result_name_suffix['failed'], 'User first name with digits must fail.' );

		// Completely independent password should pass.
		$result_clean = $this->password_checker->run_tests( 'UniqueUnrelatedPassword!', $tests );
		$this->assertEmpty( $result_clean['failed'], 'Unrelated password must pass user data check.' );
	}

	/**
	 * Test instantiation defaulting to current user.
	 */
	public function test_instantiation_with_current_user() {
		wp_set_current_user( $this->user_id );
		$checker = new Password_Checker();
		$this->assertInstanceOf( Password_Checker::class, $checker );

		$result = $checker->test( 'Str0ng#P@ssw0rd!2026' );
		$this->assertTrue( $result['passed'], 'Password checker with current user should evaluate successfully.' );
	}

	/**
	 * Test calculate_entropy_bits produces expected relative values.
	 */
	public function test_calculate_entropy_bits() {
		$ref    = new \ReflectionClass( $this->password_checker );
		$method = $ref->getMethod( 'calculate_entropy_bits' );

		$weak_entropy   = $method->invoke( $this->password_checker, 'aaaaaa' );
		$strong_entropy = $method->invoke( $this->password_checker, 'C0mpl3x#P@ssw0rd!2026' );

		$this->assertIsFloat( $weak_entropy );
		$this->assertIsFloat( $strong_entropy );
		$this->assertGreaterThan( $weak_entropy, $strong_entropy, 'Complex password must have higher entropy than repetitive characters.' );
		$this->assertGreaterThan( (float) $this->password_checker->minimum_entropy_bits, $strong_entropy, 'Complex password entropy must exceed minimum threshold.' );
	}
}
