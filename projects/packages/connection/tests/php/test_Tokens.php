<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Tokens functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;
use Requests_Utility_CaseInsensitiveDictionary;
use WP_Error;

/**
 * Tokens functionality testing.
 */
class TokensTest extends TestCase {
	/**
	 * Initialize the object before running the test method.
	 *
	 * @before
	 */
	public function set_up() {
		$this->tokens = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Tokens' )
			->setMethods( array( 'get_access_token' ) )
			->getMock();
	}

	/**
	 * Clean up the testing environment.
	 *
	 * @after
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_options' );
		unset( $this->tokens );
		Constants::clear_constants();
	}

	/**
	 * Test the `validate` functionality when the site is not registered.
	 *
	 * @covers Automattic\Jetpack\Connection\Tokens::validate
	 */
	public function test_validate_when_site_is_not_registered() {
		$expected = new WP_Error( 'site_not_registered', 'Site not registered.' );
		$this->assertEquals( $expected, $this->tokens->validate() );
	}

	/**
	 * Test the `validate` functionality when the current user is not connnected, aka user token is missing.
	 *
	 * @covers Automattic\Jetpack\Connection\Tokens::validate
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

		$this->tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->will( $this->onConsecutiveCalls( $blog_token, $user_token ) );
		$this->assertFalse( $this->tokens->validate() );
	}

	/**
	 * Test the `validate` functionality when the remote request to the `jetpack-token-health` endpoint fails.
	 *
	 * @covers Automattic\Jetpack\Connection\Tokens::validate
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

		$this->tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->will( $this->onConsecutiveCalls( $blog_token, $user_token ) );

		$this->assertFalse( $this->tokens->validate() );

		remove_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_failed' ), 10 );
	}

	/**
	 * Test the `validate` functionality when the remote request to the `jetpack-token-health` endpoint succeeds.
	 *
	 * @covers Automattic\Jetpack\Connection\Tokens::validate
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

		$this->tokens->expects( $this->exactly( 2 ) )
			->method( 'get_access_token' )
			->will( $this->onConsecutiveCalls( $blog_token, $user_token ) );

		$expected = array(
			'blog_token' => array(
				'is_healthy' => true,
			),
			'user_token' => array(
				'is_healthy'     => true,
				'is_master_user' => true,
			),
		);
		$this->assertSame( $expected, $this->tokens->validate() );

		remove_filter( 'pre_http_request', array( $this, 'intercept_jetpack_token_health_request_success' ), 10 );
	}

	/**
	 * Test the `get_signed_token` functionality.
	 *
	 * @covers Automattic\Jetpack\Connection\Tokens::get_signed_token
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
		$this->assertTrue( strpos( $signed_token, 'token' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'timestamp' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'nonce' ) !== false );
		$this->assertTrue( strpos( $signed_token, 'signature' ) !== false );
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
		if ( false === strpos( $url, 'jetpack-token-health' ) ) {
			return $response;
		}

		return array(
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( array( 'dummy_error' => true ) ),
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
		if ( false === strpos( $url, 'jetpack-token-health' ) ) {
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
			'headers'  => new Requests_Utility_CaseInsensitiveDictionary( array( 'content-type' => 'application/json' ) ),
			'body'     => wp_json_encode( $body ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
		);
	}
}
