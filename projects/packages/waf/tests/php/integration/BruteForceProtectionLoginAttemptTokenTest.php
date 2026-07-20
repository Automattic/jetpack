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
		delete_transient( 'brute_use_math' );

		foreach ( array( 'jpp_li_browser', 'jpp_li_renderer', 'jpp_li_preauth', 'jpp_li_replay', 'jpp_li_hard-block' ) as $fingerprint ) {
			delete_transient( 'jpp_attempt_' . md5( $fingerprint ) );
		}

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
	 * Verify that an approved login form receives a login attempt token.
	 */
	public function test_protection_renders_token_for_approved_login_form() {
		$this->assertTrue( method_exists( Brute_Force_Protection::class, 'render_login_attempt_token' ) );
		$protection = $this->protection( 'jpp_li_renderer' );

		ob_start();
		$protection->render_login_attempt_token();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'name="' . self::FIELD_NAME . '"', $html );
	}

	/**
	 * Verify that the token is rendered after the login form status checks.
	 */
	public function test_protection_registers_token_after_login_form_status_checks() {
		$reflection  = new ReflectionClass( Brute_Force_Protection::class );
		$protection  = $reflection->newInstanceWithoutConstructor();
		$constructor = $reflection->getConstructor();
		$constructor->invoke( $protection );

		$this->assertSame( 2, has_action( 'login_form', array( $protection, 'render_login_attempt_token' ) ) );
	}

	/**
	 * Verify that no approval token is issued once the math fallback is active.
	 */
	public function test_protection_does_not_render_token_while_math_fallback_is_active() {
		$this->assertTrue( method_exists( Brute_Force_Protection::class, 'render_login_attempt_token' ) );
		$protection = $this->protection( 'jpp_li_renderer' );
		$protection->set_transient( 'brute_use_math', 1, 600 );

		ob_start();
		$protection->render_login_attempt_token();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Verify that no approval token is issued once a soft block selects math.
	 */
	public function test_protection_does_not_render_token_after_soft_block() {
		$this->assertTrue( method_exists( Brute_Force_Protection::class, 'render_login_attempt_token' ) );
		$protection = $this->protection( 'jpp_li_renderer' );
		$property   = new ReflectionProperty( Brute_Force_Protection::class, 'block_login_with_math' );
		$property->setValue( $protection, 1 );

		ob_start();
		$protection->render_login_attempt_token();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Verify that a previously approved request bypasses a newly selected math fallback.
	 */
	public function test_approved_attempt_continues_when_status_changes_during_submission() {
		$protection = $this->preauth_protection( 'jpp_li_preauth', 1 );
		$protection->expects( $this->never() )->method( 'block_with_math' );
		$token                     = $this->render_token_for_protection( $protection );
		$_POST[ self::FIELD_NAME ] = $token;
		$_POST['log']              = 'example';

		$this->assertSame( 'approved-user', $protection->check_preauth( 'approved-user' ) );
	}

	/**
	 * Verify that replaying an approved request follows the existing fallback path.
	 */
	public function test_replayed_attempt_does_not_bypass_fallback() {
		$protection = $this->preauth_protection( 'jpp_li_replay', 2 );
		$protection->expects( $this->once() )->method( 'block_with_math' )->willReturn( false );
		$token                     = $this->render_token_for_protection( $protection );
		$_POST[ self::FIELD_NAME ] = $token;
		$_POST['log']              = 'example';

		$this->assertSame( 'approved-user', $protection->check_preauth( 'approved-user' ) );
		$this->assertSame( 'approved-user', $protection->check_preauth( 'approved-user' ) );
	}

	/**
	 * Verify that a token never skips the authoritative status check.
	 */
	public function test_approved_attempt_does_not_bypass_hard_block_check() {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'check_login_ability', 'get_transient_name' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( 'jpp_li_hard-block' );
		$protection->expects( $this->once() )
			->method( 'check_login_ability' )
			->with( true )
			->willThrowException( new RuntimeException( 'hard block' ) );
		$_POST[ self::FIELD_NAME ] = $this->render_token_for_protection( $protection );

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'hard block' );

		$protection->check_preauth( 'approved-user' );
	}

	/**
	 * Create a token manager with a stable Protect client fingerprint.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @return Brute_Force_Protection_Login_Attempt_Token
	 */
	private function token_manager( $fingerprint ) {
		return new Brute_Force_Protection_Login_Attempt_Token( $this->protection( $fingerprint ) );
	}

	/**
	 * Create a testable Brute Force Protection instance with a stable fingerprint.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @return Brute_Force_Protection
	 */
	private function protection( $fingerprint ) {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_transient_name' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( $fingerprint );

		return $protection;
	}

	/**
	 * Create a testable protection instance whose status check selects math.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @param int    $check_count Number of expected status checks.
	 * @return Brute_Force_Protection
	 */
	private function preauth_protection( $fingerprint, $check_count ) {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'block_with_math', 'check_login_ability', 'get_transient_name' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( $fingerprint );
		$protection->expects( $this->exactly( $check_count ) )
			->method( 'check_login_ability' )
			->with( true )
			->willReturn( false );

		return $protection;
	}

	/**
	 * Render and extract a login attempt token.
	 *
	 * @param string $fingerprint Protect client fingerprint.
	 * @return string
	 */
	private function render_token( $fingerprint ) {
		return $this->render_token_for_protection( $this->protection( $fingerprint ) );
	}

	/**
	 * Render and extract a login attempt token for a protection instance.
	 *
	 * @param Brute_Force_Protection $protection Brute Force Protection instance.
	 * @return string
	 */
	private function render_token_for_protection( $protection ) {

		ob_start();
		( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->render_field();
		$html = ob_get_clean();

		$this->assertSame( 1, preg_match( '/value="([a-f0-9]{32})"/', $html, $matches ) );

		return $matches[1];
	}
}
