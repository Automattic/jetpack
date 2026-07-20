<?php
/**
 * Tests for the Brute Force Protection login attempt token.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Login_Attempt_Token;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

/**
 * Brute Force Protection login attempt token test case.
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */ ]
class BruteForceProtectionLoginAttemptTokenTest extends WorDBless\BaseTestCase {
	/**
	 * Form field used by the login attempt token.
	 */
	private const FIELD_NAME = 'jetpack_protect_login_attempt';
	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		$_POST = array();

		parent::tearDown();
	}

	/**
	 * Verify that the login attempt token helper is available.
	 */
	public function test_login_attempt_token_helper_is_available() {
		$this->assertTrue(
			class_exists( 'Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Login_Attempt_Token' )
		);
	}

	/**
	 * Verify that a valid token cannot be replayed.
	 */
	public function test_token_can_only_be_consumed_once() {
		$token                     = $this->render_token( 'jpp_li_browser' );
		$_POST[ self::FIELD_NAME ] = $token;

		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that a token cannot move between Protect client fingerprints.
	 */
	public function test_token_is_bound_to_the_client_fingerprint() {
		$_POST[ self::FIELD_NAME ] = $this->render_token( 'jpp_li_browser-a' );

		$this->assertFalse( $this->token_manager( 'jpp_li_browser-b' )->consume() );
	}

	/**
	 * Verify that a token without its transient is rejected.
	 */
	public function test_expired_token_is_rejected() {
		$_POST[ self::FIELD_NAME ] = $this->render_token( 'jpp_li_browser' );
		delete_transient( 'jpp_attempt_' . md5( 'jpp_li_browser' ) );

		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that rendering a new form invalidates an older form token.
	 */
	public function test_only_the_latest_rendered_token_is_valid() {
		$old_token = $this->render_token( 'jpp_li_browser' );
		$new_token = $this->render_token( 'jpp_li_browser' );

		$_POST[ self::FIELD_NAME ] = $old_token;
		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );

		$_POST[ self::FIELD_NAME ] = $new_token;
		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Create a token manager with a stable Protect client fingerprint.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @return Brute_Force_Protection_Login_Attempt_Token
	 */
	private function token_manager( $fingerprint ) {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_transient_name' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( $fingerprint );

		return new Brute_Force_Protection_Login_Attempt_Token( $protection );
	}

	/**
	 * Render and extract a login attempt token.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @return string
	 */
	private function render_token( $fingerprint ) {
		$this->assertTrue( method_exists( Brute_Force_Protection_Login_Attempt_Token::class, 'render_field' ) );

		ob_start();
		$this->token_manager( $fingerprint )->render_field();
		$html = ob_get_clean();

		$this->assertSame( 1, preg_match( '/value="([a-f0-9]{32})"/', $html, $matches ) );

		return $matches[1];
	}
}
