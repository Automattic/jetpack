<?php
/**
 * Tests for VideoPress_Rest_Api_V1_Site.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the VideoPress site information REST API endpoint.
 */
class VideoPress_Rest_Api_V1_Site_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID.
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Number of intercepted WordPress.com requests.
	 *
	 * @var int
	 */
	private $request_count = 0;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->admin_id      = wp_insert_user(
			array(
				'user_login' => 'videopress_site_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'videopress_site_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'mock_site_info_response' ), 10, 0 );

		VideoPress_Rest_Api_V1_Site::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after each test.
	 */
	public function tearDown(): void {
		remove_filter( 'pre_http_request', array( $this, 'mock_site_info_response' ), 10 );
		Constants::clear_constants();
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		wp_set_current_user( 0 );

		global $wp_rest_server;
		$wp_rest_server = null;

		parent::tearDown();
	}

	/**
	 * Return a representative administrative site payload without making an
	 * external request.
	 *
	 * @return array Mock HTTP response.
	 */
	public function mock_site_info_response() {
		++$this->request_count;

		return array(
			'headers'  => array(),
			'body'     => wp_json_encode(
				array(
					'ID'      => 1234,
					'options' => array( 'administrative_option' => 'private' ),
				),
				JSON_UNESCAPED_SLASHES
			),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Dispatch a request to the site information endpoint.
	 *
	 * @return \WP_REST_Response REST response.
	 */
	private function get_site_info() {
		return $this->server->dispatch( new WP_REST_Request( 'GET', '/videopress/v1/site' ) );
	}

	/**
	 * Subscribers cannot retrieve or trigger the administrative site payload.
	 */
	public function test_subscriber_request_is_rejected_before_proxying() {
		wp_set_current_user( $this->subscriber_id );

		$response = $this->get_site_info();

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
		$this->assertSame( 0, $this->request_count );
	}

	/**
	 * Administrators retain access to the site information payload.
	 */
	public function test_administrator_request_succeeds() {
		wp_set_current_user( $this->admin_id );

		$response = $this->get_site_info();

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'ID'      => 1234,
				'options' => array( 'administrative_option' => 'private' ),
			),
			$response->get_data()
		);
		$this->assertSame( 1, $this->request_count );
	}
}
