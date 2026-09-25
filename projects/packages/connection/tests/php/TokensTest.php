<?php
/**
 * Tokens functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use DateTime;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_Error;
use WpOrg\Requests\Utility\CaseInsensitiveDictionary;

/**
 * Tokens functionality testing.
 *
 * @covers \Automattic\Jetpack\Connection\Tokens
 */
#[CoversClass( Tokens::class )]
class TokensTest extends TestCase {

	/**
	 * Used by filters to set the current `site_url`.
	 *
	 * @var string
	 */
	private $site_url;

	/**
	 * Clean up the testing environment.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_all_filters( 'jetpack_options' );
		Constants::clear_constants();
	}

	/**
	 * Test the `validate` functionality when the site is not registered.
	 */
	public function test_validate_when_site_is_not_registered() {
		$expected = new WP_Error( 'site_not_registered', 'Site not registered.' );
		$this->assertEquals( $expected, ( new Tokens() )->validate() );
	}

	/**
	 * Test the `validate` functionality when the current user is not connnected, aka user token is missing.
	 */
	public function test_validate_with_missing_user_token() {
		add_filter(
			'jetpack_options',
			function ( $value, $name ) {
				return 'id' === $name ? 123 : $value;
			},
			10,
			2
		);
		$blog_token = (object) array(
			'secret'           => 'abcd.1234',
			'external_user_id' => null,
		);

		$user_token = false;

		$tokens = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Tokens' )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->willReturnOnConsecutiveCalls( $blog_token, $user_token );
		$this->assertFalse( $tokens->validate() );
	}

	/**
	 * Test the `validate` functionality when the remote request to the `jetpack-token-health` endpoint fails.
	 */
	public function test_validate_with_failed_remote_request() {
		add_filter(
			'jetpack_options',
			function ( $value, $name ) {
				return 'id' === $name ? 123 : $value;
			},
			10,
			2
		);
		add_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_failed' ), 10, 3 );
		$blog_token = (object) array(
			'secret'           => 'abcd.1234',
			'external_user_id' => null,
		);

		$user_token = (object) array(
			'secret'           => 'abcd.4321',
			'external_user_id' => 1,
		);

		$tokens = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Tokens' )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->willReturnOnConsecutiveCalls( $blog_token, $user_token );

		$this->assertFalse( $tokens->validate() );

		remove_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_failed' ), 10 );
	}

	/**
	 * Test the `validate` functionality when the remote request to the `jetpack-token-health` endpoint succeeds.
	 */
	public function test_validate() {
		add_filter(
			'jetpack_options',
			function ( $value, $name ) {
				return 'id' === $name ? 123 : $value;
			},
			10,
			2
		);
		add_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_success' ), 10, 3 );
		$blog_token = (object) array(
			'secret'           => 'abcd.1234',
			'external_user_id' => null,
		);

		$user_token = (object) array(
			'secret'           => 'abcd.4321',
			'external_user_id' => 1,
		);

		$tokens = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Tokens' )
			->onlyMethods( array( 'get_access_token' ) )
			->getMock();
		$tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->willReturnOnConsecutiveCalls( $blog_token, $user_token );

		$expected = array(
			'blog_token' => array(
				'is_healthy' => true,
			),
			'user_token' => array(
				'is_healthy'     => true,
				'is_master_user' => true,
			),
		);
		$this->assertSame( $expected, $tokens->validate() );

		remove_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_success' ), 10 );
	}

	/**
	 * Test that `validate_blog_token` reports the health WordPress.com returns.
	 */
	public function test_validate_blog_token_returns_health() {
		add_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10, 2 );

		$this->assertTrue( $this->validate_blog_token_with_response( 200, array( 'is_healthy' => true ) ) );
		$this->assertFalse( $this->validate_blog_token_with_response( 200, array( 'is_healthy' => false ) ) );

		remove_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10 );
	}

	/**
	 * Test that `validate_blog_token` returns a WP_Error, not false, when the check cannot be performed.
	 */
	public function test_validate_blog_token_returns_error_when_check_fails() {
		add_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10, 2 );

		$failed = $this->validate_blog_token_with_response( 500, array( 'dummy_error' => true ) );
		$this->assertInstanceOf( WP_Error::class, $failed );
		$this->assertSame( 'blog_token_check_failed', $failed->get_error_code() );

		$transport = $this->validate_blog_token_with_response( new WP_Error( 'http_request_failed' ), null );
		$this->assertInstanceOf( WP_Error::class, $transport );
		$this->assertSame( 'http_request_failed', $transport->get_error_code() );

		remove_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10 );
	}

	/**
	 * Test that `validate_blog_token` reports a missing blog token as unhealthy, not as a failed check.
	 */
	public function test_validate_blog_token_without_blog_token() {
		add_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10, 2 );

		$this->assertFalse( ( new Tokens() )->validate_blog_token() );

		remove_filter( 'jetpack_options', array( $this, 'mock_blog_id' ), 10 );
	}

	/**
	 * Run `validate_blog_token` against a mocked `jetpack-token-health/blog` response.
	 *
	 * @param int|WP_Error $code The response code, or a WP_Error for a transport failure.
	 * @param array|null   $body The response body.
	 * @return bool|WP_Error
	 */
	private function validate_blog_token_with_response( $code, $body ) {
		$intercept = static function ( $response, $args, $url ) use ( $code, $body ) {
			if ( ! str_contains( $url, 'jetpack-token-health/blog' ) ) {
				return $response;
			}

			if ( is_wp_error( $code ) ) {
				return $code;
			}

			return array(
				'headers'  => new CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
				'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
				'response' => array(
					'code'    => $code,
					'message' => 200 === $code ? 'OK' : 'failed',
				),
			);
		};

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Jetpack_Options::update_option( 'blog_token', 'abcd.1234' );
		add_filter( 'pre_http_request', $intercept, 10, 3 );
		$result = ( new Tokens() )->validate_blog_token();
		remove_filter( 'pre_http_request', $intercept, 10 );
		Jetpack_Options::delete_option( 'blog_token' );
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );

		return $result;
	}

	/**
	 * Mock a registered site.
	 *
	 * @param mixed  $value The option value.
	 * @param string $name  The option name.
	 * @return mixed
	 */
	public function mock_blog_id( $value, $name ) {
		return 'id' === $name ? 123 : $value;
	}

	/**
	 * Test the `get_signed_token` functionality.
	 */
	public function test_get_signed_token() {
		$access_token = (object) array(
			'external_user_id' => 1,
		);

		// Missing secret.
		$invalid_token_error = new WP_Error( 'invalid_token' );
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Secret is null.
		$access_token->secret = null;
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Secret is empty.
		$access_token->secret = '';
		$this->assertEquals( $invalid_token_error, ( new Tokens() )->get_signed_token( $access_token ) );
		// Valid secret.
		$access_token->secret = 'abcd.1234';

		$signed_token = ( new Tokens() )->get_signed_token( $access_token );

		$this->assertStringContainsString( 'token', $signed_token );
		$this->assertStringContainsString( 'timestamp', $signed_token );
		$this->assertStringContainsString( 'nonce', $signed_token );
		$this->assertStringContainsString( 'signature', $signed_token );
	}

	/**
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock failed response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_jetpack_token_health_request_failed( $response, $args, $url ) {
		if ( ! str_contains( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		return array(
			'headers'  => new CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( array( 'dummy_error' => true ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'response' => array(
				'code'    => 500,
				'message' => 'failed',
			),
		);
	}

	/**
	 * Intercept the `jetpack-token-health` API request sent to WP.com, and mock successful response.
	 *
	 * @param bool|array $response The existing response.
	 * @param array      $args The request arguments.
	 * @param string     $url The request URL.
	 *
	 * @return array
	 */
	public function intercept_jetpack_token_health_request_success( $response, $args, $url ) {
		if ( ! str_contains( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		$body = array(
			'blog_token' => array(
				'is_healthy' => true,
			),
			'user_token' => array(
				'is_healthy'     => true,
				'is_master_user' => true,
			),
		);

		return array(
			'headers'  => new CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( $body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}

	/**
	 * Test the locking/unlocking tokens functionality.
	 */
	public function test_set_lock() {
		$tokens = new Tokens();

		$this->site_url = 'https://test1.example.org';

		add_filter( 'jetpack_sync_site_url', array( $this, 'filter_site_url' ), 10 );

		$lock_set = $tokens->set_lock( DAY_IN_SECONDS );

		list( $lock_expiration, $lock_site_url ) = explode( '|||', Jetpack_Options::get_option( 'token_lock' ), 2 );
		$is_locked                               = $tokens->is_locked();

		$this->site_url  = 'https://test2.example.org';
		$is_locked_site2 = $tokens->is_locked();

		$tokens->remove_lock();
		$is_locked_still = $tokens->is_locked();

		static::assertTrue( $lock_set );
		static::assertFalse( $is_locked );
		static::assertTrue( $is_locked_site2 );
		static::assertFalse( $is_locked_still );

		static::assertSame( 'https://test1.example.org', base64_decode( $lock_site_url ) );

		$date = $lock_expiration ? DateTime::createFromFormat( Tokens::DATE_FORMAT_ATOM, $lock_expiration )->format( 'Y-m-d' ) : false;
		static::assertSame( gmdate( 'Y-m-d', strtotime( 'tomorrow' ) ), $date );

		remove_filter( 'jetpack_sync_site_url', array( $this, 'filter_site_url' ), 10 );
	}

	/**
	 * Test the auto-unlocking tokens functionality.
	 */
	public function test_unlock() {
		$tokens = new Tokens();

		$this->site_url = 'https://test1.example.org';

		add_filter( 'jetpack_sync_site_url', array( $this, 'filter_site_url' ), 10 );

		$tokens->set_lock( 1 );

		$this->site_url = 'https://test2.example.org';
		$is_locked      = $tokens->is_locked();

		sleep( 2 );

		$is_locked_expired_non_matching = $tokens->is_locked();
		$still_locked                   = (bool) Jetpack_Options::get_option( 'token_lock' );

		$this->site_url             = 'https://test1.example.org';
		$is_locked_expired_matching = $tokens->is_locked();
		$no_longer_locked           = (bool) Jetpack_Options::get_option( 'token_lock' );

		static::assertTrue( $is_locked );
		static::assertTrue( $still_locked );
		static::assertTrue( $is_locked_expired_non_matching );
		static::assertFalse( $is_locked_expired_matching );
		static::assertFalse( $no_longer_locked );

		remove_filter( 'jetpack_sync_site_url', array( $this, 'filter_site_url' ), 10 );
	}

	/**
	 * Filter to get the current site URL.
	 *
	 * @return string
	 */
	public function filter_site_url() {
		return $this->site_url;
	}
}
