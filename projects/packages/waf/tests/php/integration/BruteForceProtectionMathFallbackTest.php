<?php
/**
 * Tests for the Brute Force Protection standalone math page.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Math_Authenticate;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Brute Force Protection math fallback test case.
 */
class BruteForceProtectionMathFallbackTest extends WorDBless\BaseTestCase {
	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		$_POST    = array();
		$_REQUEST = array();

		parent::tearDown();
	}

	/**
	 * Verify the math page returns the login form's fields, but never the password or core's log field.
	 *
	 * @dataProvider username_source_data_provider
	 *
	 * @param string $username_field Field the username arrives in.
	 */
	#[DataProvider( 'username_source_data_provider' )]
	public function test_math_page_carries_login_fields_but_not_the_password( $username_field ) {
		$_POST[ $username_field ]  = 'devin"wp';
		$_POST['pwd']              = 'correct horse battery';
		$_POST['rememberme']       = 'forever';
		$_REQUEST['redirect_to']   = 'https://example.com/wp-admin/post.php?post=1&action=edit';
		$_REQUEST['interim-login'] = '1';

		$page = $this->math_page();

		$this->assertStringContainsString( 'name="' . Brute_Force_Protection_Math_Authenticate::USER_LOGIN_FIELD . '" value="devin&quot;wp"', $page );
		$this->assertStringContainsString( 'name="redirect_to" value="https://example.com/wp-admin/post.php?post=1&amp;action=edit"', $page );
		$this->assertStringContainsString( 'name="rememberme" value="forever"', $page );
		$this->assertStringContainsString( 'name="interim-login" value="1"', $page );
		$this->assertStringNotContainsString( 'name="log"', $page );
		$this->assertStringNotContainsString( 'correct horse battery', $page );
	}

	/**
	 * Where the username arrives: the original login POST, or a math page answered wrongly.
	 *
	 * @return array
	 */
	public static function username_source_data_provider(): array {
		return array(
			'login form'        => array( 'log' ),
			'wrong math answer' => array( Brute_Force_Protection_Math_Authenticate::USER_LOGIN_FIELD ),
		);
	}

	/**
	 * Verify only the empty-fields errors after the math page become a prompt, prefilling a carried username.
	 *
	 * @dataProvider login_errors_data_provider
	 *
	 * @param string[]    $codes          Error codes on the login page.
	 * @param string      $carried_login  Username carried by the math page.
	 * @param string|null $expected_text  Expected prompt text, or null to leave the errors alone.
	 */
	#[DataProvider( 'login_errors_data_provider' )]
	public function test_prompt_for_password_after_math_page( $codes, $carried_login, $expected_text ) {
		$_POST[ Brute_Force_Protection_Math_Authenticate::USER_LOGIN_FIELD ] = $carried_login;
		$errors = new WP_Error();
		foreach ( $codes as $code ) {
			$errors->add( $code, $code );
		}

		$result = Brute_Force_Protection_Math_Authenticate::prompt_for_password( $errors );

		if ( null === $expected_text ) {
			$this->assertSame( $errors, $result );
			$this->assertArrayNotHasKey( 'log', $_POST );
			return;
		}
		$this->assertSame( array( 'empty_password' ), $result->get_error_codes() );
		$this->assertSame( 'message', $result->get_error_data( 'empty_password' ) );
		$this->assertStringContainsString( $expected_text, $result->get_error_message() );
		$this->assertSame( '' === $carried_login ? null : $carried_login, $_POST['log'] ?? null );
	}

	/**
	 * Login errors and carried usernames, with the expected prompt.
	 *
	 * @return array
	 */
	public static function login_errors_data_provider(): array {
		return array(
			'username carried' => array( array( 'empty_username', 'empty_password' ), 'devin', 'Enter your password' ),
			'no username'      => array( array( 'empty_username', 'empty_password' ), '', 'Please log in again' ),
			'wrong password'   => array( array( 'incorrect_password' ), 'devin', null ),
		);
	}

	/**
	 * Render the standalone math page.
	 *
	 * @return string
	 */
	private function math_page() {
		try {
			Brute_Force_Protection_Math_Authenticate::generate_math_page();
		} catch ( RuntimeException $page ) {
			return $page->getMessage();
		}
	}

	/**
	 * Return a wp_die handler that throws the page for assertions.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * Throw the page instead of terminating the test process.
		 *
		 * @param string $message The page HTML.
		 * @return never
		 */
		return static function ( $message ) {
			throw new RuntimeException( $message ); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Test-only page capture.
		};
	}
}
