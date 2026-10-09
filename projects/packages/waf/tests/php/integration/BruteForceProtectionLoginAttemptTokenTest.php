<?php
/**
 * Tests for the Brute Force Protection login attempt token.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Login_Attempt_Token;
use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection_Math_Authenticate;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Brute Force Protection login attempt token test case.
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
class BruteForceProtectionLoginAttemptTokenTest extends WorDBless\BaseTestCase {
	/**
	 * Claims made during the current test, standing in for the options table's unique key.
	 *
	 * @var bool[]
	 */
	private $claims = array();

	/**
	 * Queries WorDBless received while emulating INSERT IGNORE.
	 *
	 * @var string[]
	 */
	private $queries = array();

	/**
	 * Set up each test.
	 */
	public function setUp(): void {
		parent::setUp();

		$_SERVER['REMOTE_ADDR'] = '203.0.113.10';
		unset( $_SERVER['HTTP_X_FORWARDED_FOR'] );
		delete_site_option( 'trusted_ip_header' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		$_POST = array();
		unset( $_SERVER['REMOTE_ADDR'], $_SERVER['HTTP_X_FORWARDED_FOR'] );

		parent::tearDown();
	}

	/**
	 * Verify that a valid token cannot be replayed.
	 */
	public function test_token_can_only_be_consumed_once() {
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token();

		$this->assertTrue( $this->token_manager()->consume() );
		$this->assertFalse( $this->token_manager()->consume() );
	}

	/**
	 * Verify that a claim the database ignores as a duplicate is reported as lost.
	 */
	public function test_claim_is_an_insert_that_ignores_duplicates() {
		$this->emulate_insert_ignore();
		$protection = ( new ReflectionClass( Brute_Force_Protection::class ) )->newInstanceWithoutConstructor();

		$this->assertTrue( $protection->add_login_attempt_claim( 'jpp_claim_test', 600 ) );
		$this->assertFalse( $protection->add_login_attempt_claim( 'jpp_claim_test', 600 ) );
		$this->assertStringStartsWith( 'INSERT IGNORE', $this->queries[0] );
	}

	/**
	 * Verify that a token cannot move to another client IP.
	 */
	public function test_token_is_bound_to_the_client_ip() {
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token();
		$_SERVER['REMOTE_ADDR'] = '203.0.113.11';

		$this->assertFalse( $this->token_manager()->consume() );
	}

	/**
	 * Verify that malformed input is not normalized into a valid token.
	 */
	public function test_malformed_token_does_not_consume_the_valid_token() {
		$token = $this->render_token();
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token . '!!!';

		$this->assertFalse( $this->token_manager()->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $token;
		$this->assertTrue( $this->token_manager()->consume() );
	}

	/**
	 * Verify that a token without its transient is rejected.
	 */
	public function test_expired_token_is_rejected() {
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token();
		delete_transient( $this->slot_name() );

		$this->assertFalse( $this->token_manager()->consume() );
	}

	/**
	 * Verify that later renders refreshing the slot do not extend an older token's lifetime.
	 */
	public function test_token_expires_even_when_later_renders_keep_its_slot_alive() {
		$old_token                              = $this->render_token();
		$tokens                                 = get_transient( $this->slot_name() );
		$tokens[ hash( 'sha256', $old_token ) ] = time() - Brute_Force_Protection_Login_Attempt_Token::EXPIRATION - 1;
		set_transient( $this->slot_name(), $tokens, Brute_Force_Protection_Login_Attempt_Token::EXPIRATION );
		$this->render_token();

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertFalse( $this->token_manager()->consume() );
	}

	/**
	 * Verify that an IP keeps a bounded set of tokens that spoofed proxy headers cannot enlarge.
	 */
	public function test_tokens_beyond_the_per_ip_cap_are_evicted_oldest_first() {
		$tokens = array();
		for ( $i = 0; $i <= Brute_Force_Protection_Login_Attempt_Token::MAX_TOKENS_PER_IP; $i++ ) {
			$_SERVER['HTTP_X_FORWARDED_FOR'] = '198.51.100.' . $i;
			$tokens[]                        = $this->render_token();
		}

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $tokens[0];
		$this->assertFalse( $this->token_manager()->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $tokens[1];
		$this->assertTrue( $this->token_manager()->consume() );
	}

	/**
	 * Verify that a render interleaved with a consume keeps both tokens usable exactly once.
	 */
	public function test_render_during_consume_keeps_the_replacement_token() {
		$state             = array();
		$replacement_token = null;
		$protection        = $this->protection( array( 'get_transient', 'set_transient' ) );
		$protection->method( 'set_transient' )
			->willReturnCallback(
				static function ( $name, $value ) use ( &$state ) {
					$state[ $name ] = $value;
					return true;
				}
			);
		$protection->method( 'get_transient' )
			->willReturnCallback(
				function ( $name ) use ( &$state, &$replacement_token, $protection ) {
					$value = $state[ $name ] ?? false;

					if ( 'pending' === $replacement_token ) {
						$replacement_token = '';
						$replacement_token = $this->render_token_for_protection( $protection );
					}

					return $value;
				}
			);

		$old_token         = $this->render_token_for_protection( $protection );
		$replacement_token = 'pending';
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertTrue( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $replacement_token;
		$this->assertTrue( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );

		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $old_token;
		$this->assertFalse( ( new Brute_Force_Protection_Login_Attempt_Token( $protection ) )->consume() );
	}

	/**
	 * Verify that a form Protect is not asking to solve math for receives a token, allow-listed IPs included.
	 *
	 * @dataProvider approved_form_data_provider
	 *
	 * @param bool $allow_listed Whether the client IP is allow-listed.
	 */
	#[DataProvider( 'approved_form_data_provider' )]
	public function test_protection_renders_token_for_approved_login_form( $allow_listed ) {
		if ( $allow_listed ) {
			add_filter( 'jpp_allow_login', '__return_true' );
		}

		ob_start();
		$this->protection()->render_login_attempt_token();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'name="' . Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME . '"', $html );
	}

	/**
	 * Client IPs whose approved forms need a token.
	 *
	 * @return array
	 */
	public static function approved_form_data_provider(): array {
		return array(
			'regular IP'      => array( false ),
			'allow-listed IP' => array( true ),
		);
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
	 * Verify that no token is issued for a form Protect is asking to solve math for.
	 *
	 * @dataProvider unapproved_form_data_provider
	 *
	 * @param string $state The login form state.
	 */
	#[DataProvider( 'unapproved_form_data_provider' )]
	public function test_protection_does_not_render_token_for_unapproved_form( $state ) {
		$protection = $this->protection();
		if ( 'math fallback' === $state ) {
			$protection->set_transient( 'brute_use_math', 1, 600 );
		} else {
			$protection->block_with_math();
		}

		ob_start();
		$protection->render_login_attempt_token();

		$this->assertSame( '', ob_get_clean() );
	}

	/**
	 * Login form states that must not receive a token.
	 *
	 * @return array
	 */
	public static function unapproved_form_data_provider(): array {
		return array(
			'math fallback is active'  => array( 'math fallback' ),
			'soft block selected math' => array( 'soft block' ),
		);
	}

	/**
	 * Verify that an approved token passes the math check once, then the math page applies again.
	 */
	public function test_approved_token_passes_math_once() {
		$this->emulate_insert_ignore();
		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token_for_protection( Brute_Force_Protection::instance() );

		$this->assertTrue( Brute_Force_Protection_Math_Authenticate::math_authenticate() );

		$this->expectException( Exception::class );
		Brute_Force_Protection_Math_Authenticate::math_authenticate();
	}

	/**
	 * Verify that a database-style string transient still invokes the math fallback.
	 */
	public function test_string_math_transient_still_requires_math_without_approved_token() {
		$protection = $this->protection( array( 'check_login_ability', 'get_transient' ) );
		$protection->method( 'check_login_ability' )->willReturn( true );
		$protection->method( 'get_transient' )->with( 'brute_use_math' )->willReturn( '1' );
		$_POST['log'] = 'example';
		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );

		$this->expectException( Exception::class );

		$protection->check_preauth();
	}

	/**
	 * Verify that a token never skips the authoritative status check.
	 */
	public function test_approved_attempt_does_not_bypass_hard_block_check() {
		$protection = $this->protection( array( 'get_cached_status', 'is_current_ip_allowed', 'kill_login' ) );
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
	 * Verify that a token does not override a site that kills logins instead of showing math.
	 */
	public function test_token_does_not_override_the_kill_setting() {
		$protection = $this->protection( array( 'check_login_ability', 'kill_login' ) );
		$protection->method( 'check_login_ability' )->willReturn( false );
		$protection->expects( $this->once() )
			->method( 'kill_login' )
			->willThrowException( new RuntimeException( 'killed' ) );
		add_filter( 'jpp_use_captcha_when_blocked', '__return_false' );
		$_POST[ Brute_Force_Protection_Login_Attempt_Token::FIELD_NAME ] = $this->render_token_for_protection( $protection );
		$_POST['log'] = 'example';

		$this->expectException( RuntimeException::class );
		$this->expectExceptionMessage( 'killed' );

		$protection->check_preauth( 'approved-user' );
	}

	/**
	 * Record a claim, failing for one already made.
	 *
	 * @param string $claim_name Claim name.
	 * @return bool
	 */
	public function claim( $claim_name ) {
		if ( isset( $this->claims[ $claim_name ] ) ) {
			return false;
		}
		$this->claims[ $claim_name ] = true;

		return true;
	}

	/**
	 * Report WorDBless queries' affected rows as a table with a unique option_name would.
	 *
	 * @param array  $results Query results.
	 * @param string $query   SQL query.
	 * @return array
	 */
	public function insert_ignore( $results, $query ) {
		global $wpdb;
		$wpdb->rows_affected = in_array( $query, $this->queries, true ) ? 0 : 1;
		$this->queries[]     = $query;

		return $results;
	}

	/**
	 * Emulate INSERT IGNORE on WorDBless, which has no database.
	 */
	private function emulate_insert_ignore() {
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'insert_ignore' ), 10, 2 );
	}

	/**
	 * Create a token manager for the current request.
	 *
	 * @return Brute_Force_Protection_Login_Attempt_Token
	 */
	private function token_manager() {
		return new Brute_Force_Protection_Login_Attempt_Token( $this->protection() );
	}

	/**
	 * Create a testable Brute Force Protection instance whose claims use this test's store.
	 *
	 * @param string[] $methods Additional methods to mock.
	 * @return Brute_Force_Protection|\PHPUnit\Framework\MockObject\MockObject
	 */
	private function protection( $methods = array() ) {
		$protection = $this->getMockBuilder( Brute_Force_Protection::class )
			->disableOriginalConstructor()
			->onlyMethods( array_merge( array( 'add_login_attempt_claim' ), $methods ) )
			->getMock();
		$protection->method( 'add_login_attempt_claim' )->willReturnCallback( array( $this, 'claim' ) );

		return $protection;
	}

	/**
	 * Get the token slot for the current client IP.
	 *
	 * @return string
	 */
	private function slot_name() {
		return Brute_Force_Protection_Login_Attempt_Token::TRANSIENT_PREFIX . md5( $_SERVER['REMOTE_ADDR'] );
	}

	/**
	 * Render and extract a login attempt token.
	 *
	 * @return string
	 */
	private function render_token() {
		return $this->render_token_for_protection( $this->protection() );
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
