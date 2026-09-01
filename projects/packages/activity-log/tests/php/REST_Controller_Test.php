<?php
/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-activity-log
 */

namespace Automattic\Jetpack\Activity_Log;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WP_Error;

class REST_Controller_Test extends TestCase {

	/**
	 * The mocked blog ID.
	 *
	 * @var int
	 */
	const BLOG_ID = 999;

	/**
	 * Captured request URL from the most recent mocked HTTP request.
	 *
	 * @var string
	 */
	private $captured_url = '';

	protected function setUp(): void {
		parent::setUp();
		// Mock a connected site so wpcom-as-blog requests can be signed.
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', self::BLOG_ID );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		REST_Controller::clear_access_cache();
	}

	protected function tearDown(): void {
		REST_Controller::clear_access_cache();
		$this->captured_url = '';
		parent::tearDown();
	}

	public function test_has_access_returns_true_when_full_activity_log_feature_is_active() {
		add_filter( 'pre_http_request', array( $this, 'mock_features_with_full_activity_log' ), 10, 3 );

		$result = REST_Controller::has_activity_logs_access();

		remove_filter( 'pre_http_request', array( $this, 'mock_features_with_full_activity_log' ) );

		$this->assertTrue( $result );
		// The check must hit the features endpoint, not the legacy rewind endpoint.
		$this->assertStringContainsString( '/sites/' . self::BLOG_ID . '/features', $this->captured_url );
		$this->assertStringNotContainsString( '/rewind', $this->captured_url );
	}

	public function test_has_access_returns_false_when_feature_is_absent() {
		add_filter( 'pre_http_request', array( $this, 'mock_features_without_full_activity_log' ), 10, 3 );

		$result = REST_Controller::has_activity_logs_access();

		remove_filter( 'pre_http_request', array( $this, 'mock_features_without_full_activity_log' ) );

		$this->assertFalse( $result );
	}

	public function test_has_access_fails_closed_on_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = REST_Controller::has_activity_logs_access();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$this->assertFalse( $result );
	}

	public function test_has_access_fails_closed_on_non_200() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );

		$result = REST_Controller::has_activity_logs_access();

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_server_error' ) );

		$this->assertFalse( $result );
	}

	/**
	 * Mock the features endpoint returning a plan that grants full-activity-log.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_features_with_full_activity_log( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'active'    => array( 'scan', 'full-activity-log', 'backups' ),
					'available' => array(),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * Mock the features endpoint returning a plan without full-activity-log.
	 *
	 * @param false  $preempt     Short-circuit value (unused).
	 * @param array  $parsed_args Request args (unused).
	 * @param string $url         The request URL.
	 * @return array
	 */
	public function mock_features_without_full_activity_log( $preempt, $parsed_args, $url ) {
		$this->captured_url = (string) $url;

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'active'    => array( 'free-blog', 'social-shares-1000' ),
					'available' => array(),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
	}

	/**
	 * Mock the HTTP request to return a WP_Error.
	 *
	 * @return WP_Error
	 */
	public function mock_request_as_wp_error() {
		return new WP_Error( 'http_request_failed', 'The request failed.' );
	}

	/**
	 * Mock the HTTP request to return a 500 response.
	 *
	 * @return array
	 */
	public function mock_request_as_server_error() {
		return array(
			'response' => array( 'code' => 500 ),
			'body'     => '',
		);
	}
}
