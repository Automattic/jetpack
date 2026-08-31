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
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
class BruteForceProtectionLoginAttemptTokenTest extends WorDBless\BaseTestCase {
	/**
	 * Tokens issued during the current test.
	 *
	 * @var string[]
	 */
	private $issued_tokens = array();

	/**
	 * Whether the test environment was using an external object cache.
	 *
	 * @var bool
	 */
	private $was_using_ext_object_cache;

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();

		$this->was_using_ext_object_cache = wp_using_ext_object_cache();
		$_SERVER['REMOTE_ADDR']           = '203.0.113.10';
		unset( $_SERVER['HTTP_X_FORWARDED_FOR'] );
		delete_site_option( 'trusted_ip_header' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		$_POST = array();
		unset( $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_X_FORWARDED_FOR'] );
		remove_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
		delete_transient( 'brute_use_math' );
		delete_site_option( 'trusted_ip_header' );

		delete_transient( 'jpp_attempt_' . md5( '203.0.113.10' ) );

		foreach ( $this->issued_tokens as $token ) {
			$claim_name = 'jpp_claim_' . substr( hash( 'sha256', $token ), 0, 32 );
			delete_transient( $claim_name );
			delete_option( '_transient_' . $claim_name );
			delete_option( '_transient_timeout_' . $claim_name );
		}
		$this->issued_tokens = array();
		wp_using_ext_object_cache( $this->was_using_ext_object_cache );

		parent::tearDown();
	}

	/**
	 * Verify that a valid token cannot be replayed.
	 */
	public function test_token_can_only_be_consumed_once() {
		$token = $this->render_token( 'jpp_li_browser' );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;

		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that evicting only an external-cache claim cannot make a token reusable.
	 */
	public function test_claim_survives_selective_external_object_cache_eviction() {
		wp_using_ext_object_cache( true );
		$token = $this->render_token( 'jpp_li_browser' );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;

		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
		wp_cache_delete( 'jpp_claim_' . substr( hash( 'sha256', $token ), 0, 32 ), 'transient' );

		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that a token cannot move between Protect client fingerprints.
	 */
	public function test_token_is_bound_to_the_client_fingerprint() {
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token( 'jpp_li_browser-a' );

		$this->assertFalse( $this->token_manager( 'jpp_li_browser-b' )->consume() );
	}

	/**
	 * Verify that malformed input is not normalized into a valid token.
	 */
	public function test_malformed_token_does_not_consume_the_valid_token() {
		$token = $this->render_token( 'jpp_li_browser' );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token . '!!!';

		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;
		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that a token without its transient is rejected.
	 */
	public function test_expired_token_is_rejected() {
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token( 'jpp_li_browser' );
		delete_transient( 'jpp_attempt_' . md5( '203.0.113.10' ) );

		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that rendering a new form invalidates an older form token.
	 */
	public function test_only_the_latest_rendered_token_is_valid() {
		$old_token = $this->render_token( 'jpp_li_browser' );
		$new_token = $this->render_token( 'jpp_li_browser' );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertFalse( $this->token_manager( 'jpp_li_browser' )->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $new_token;
		$this->assertTrue( $this->token_manager( 'jpp_li_browser' )->consume() );
	}

	/**
	 * Verify that attacker-controlled proxy headers cannot create extra token slots.
	 */
	public function test_untrusted_proxy_headers_do_not_create_additional_token_slots() {
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.1';
		$old_token                       = $this->render_token( 'jpp_li_spoof-a' );
		$_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.2';
		$new_token                       = $this->render_token( 'jpp_li_spoof-b' );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertFalse( $this->token_manager( 'jpp_li_spoof-a' )->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $new_token;
		$this->assertTrue( $this->token_manager( 'jpp_li_spoof-b' )->consume() );
	}

	/**
	 * Verify that an interleaved render cannot make an old token reusable or destroy the replacement.
	 */
	public function test_render_during_consume_preserves_single_use_and_the_replacement_token() {
		$state                = array();
		$replacement_token    = '';
		$replacement_rendered = false;
		$protection           = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'delete_transient', 'get_transient', 'get_transient_name', 'set_transient' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( 'jpp_li_interleaved' );
		$protection->method( 'set_transient' )
			->willReturnCallback(
				static function ( $name, $value ) use ( &$state ) {
					$state[ $name ] = $value;
					return true;
				}
			);
		$protection->method( 'get_transient' )
			->willReturnCallback(
				function ( $name ) use ( &$state, &$replacement_token, &$replacement_rendered, $protection ) {
					$value = $state[ $name ] ?? false;

					if ( 0 === strpos( $name, 'jpp_attempt_' ) && ! $replacement_rendered ) {
						$replacement_rendered = true;
						$replacement_token    = $this->render_token_for_protection( $protection );
					}

					return $value;
				}
			);
		$protection->method( 'delete_transient' )
			->willReturnCallback(
				static function ( $name ) use ( &$state ) {
					unset( $state[ $name ] );
					return true;
				}
			);

		$old_token = $this->render_token_for_protection( $protection );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertFalse( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );
		$this->assertNotSame( '', $replacement_token );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $replacement_token;
		$this->assertTrue( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );
		$this->assertFalse( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );
	}

	/**
	 * Verify that an approved login form receives a login attempt token.
	 */
	public function test_protection_renders_token_for_approved_login_form() {
		$protection = $this->protection( 'jpp_li_renderer' );

		ob_start();
		$protection->render_login_attempt_token();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'name="' . Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME . '"', $html );
	}

	/**
	 * Verify that the token is rendered after the login form status checks.
	 */
	public function test_protection_registers_token_after_login_form_status_checks() {
		$reflection  = new ReflectionClass( Brute_Force_Protection::class );
		$protection  = $reflection->newInstanceWithoutConstructor();
		$constructor = $reflection->getConstructor();
		if ( PHP_VERSION_ID < 80100 ) {
			$constructor->setAccessible( true );
		}
		$constructor->invoke( $protection );

		$this->assertSame( 2, has_action( 'login_form', array( $protection, 'render_login_attempt_token' ) ) );
	}

	/**
	 * Verify that no approval token is issued once the math fallback is active.
	 */
	public function test_protection_does_not_render_token_while_math_fallback_is_active() {
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
		$protection = $this->protection( 'jpp_li_renderer' );
		$property   = new ReflectionProperty( Brute_Force_Protection::class, 'block_login_with_math' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $protection, 1 );

		ob_start();
		$protection->render_login_attempt_token();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Verify that a database-style string transient still invokes the math fallback.
	 */
	public function test_string_math_transient_still_requires_math_without_approved_token() {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'check_login_ability', 'get_transient' ) )
			->getMock();
		$protection->method( 'check_login_ability' )->willReturn( true );
		$protection->method( 'get_transient' )->with( 'brute_use_math' )->willReturn( '1' );
		$_POST['log'] = 'example';
		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );

		$this->expectException( Exception::class );

		$protection->check_preauth();
	}

	/**
	 * Verify that a previously approved request bypasses a newly selected math fallback.
	 */
	public function test_approved_attempt_continues_when_status_changes_during_submission() {
		$protection = $this->preauth_protection( 'jpp_li_preauth', 1 );
		$protection->expects( $this->never() )->method( 'block_with_math' );
		$token = $this->render_token_for_protection( $protection );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;
		$_POST['log'] = 'example';

		$this->assertSame( 'approved-user', $protection->check_preauth( 'approved-user' ) );
	}

	/**
	 * Verify that Protect leaves a downstream authentication error unchanged and consumes the token.
	 */
	public function test_approved_attempt_preserves_authentication_error_and_consumes_token() {
		$protection = $this->preauth_protection( 'jpp_li_preauth', 1 );
		$protection->expects( $this->never() )->method( 'block_with_math' );
		$token = $this->render_token_for_protection( $protection );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;
		$_POST['log'] = 'example';
		$error        = new WP_Error( 'incorrect_password', 'Incorrect password.' );

		$this->assertSame( $error, $protection->check_preauth( $error ) );
		$this->assertFalse( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );
	}

	/**
	 * Verify that replaying an approved request follows the existing fallback path.
	 */
	public function test_replayed_attempt_does_not_bypass_fallback() {
		$protection = $this->preauth_protection( 'jpp_li_replay', 2 );
		$protection->expects( $this->once() )->method( 'block_with_math' )->willReturn( false );
		$token = $this->render_token_for_protection( $protection );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;
		$_POST['log'] = 'example';

		$first_attempt  = $protection->check_preauth( 'approved-user' );
		$replay_attempt = $protection->check_preauth( 'approved-user' );

		$this->assertSame( array( 'approved-user', 'approved-user' ), array( $first_attempt, $replay_attempt ) );
	}

	/**
	 * Verify that a token never skips the authoritative status check.
	 */
	public function test_approved_attempt_does_not_bypass_hard_block_check() {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array( 'get_cached_status', 'get_transient_name', 'is_current_ip_allowed', 'kill_login' ) )
			->getMock();
		$protection->method( 'get_transient_name' )->willReturn( 'jpp_li_hard-block' );
		$protection->method( 'is_current_ip_allowed' )->willReturn( false );
		$protection->method( 'get_cached_status' )->willReturn( 'blocked-hard' );
		$protection->expects( $this->once() )
			->method( 'kill_login' )
			->willThrowException( new RuntimeException( 'hard block' ) );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token_for_protection( $protection );

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
	 * @return Brute_Force_Protection|\PHPUnit\Framework\MockObject\MockObject
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
	 * @return Brute_Force_Protection|\PHPUnit\Framework\MockObject\MockObject
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
		$this->issued_tokens[] = $matches[1];

		return $matches[1];
	}

	/**
	 * Return a wp_die handler that throws for assertions.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * Throw instead of terminating the test process.
		 *
		 * @return never
		 */
		return static function () {
			throw new Exception( 'wp_die called' );
		};
	}
}
