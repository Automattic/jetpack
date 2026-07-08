<?php
/**
 * This file contains PHPUnit tests for the REST_Controller class.
 * To run the package unit tests, run jetpack test php packages/blaze
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * PHPUnit tests for the REST_Controller class.
 *
 * @covers \Automattic\Jetpack\Blaze\REST_Controller
 */
#[CoversClass( REST_Controller::class )]
class REST_Controller_Test extends BaseTestCase {
	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id.
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * REST server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Whether the site is connected.
	 *
	 * @var bool
	 */
	private $is_connected = true;

	/**
	 * Whether the user is connected.
	 *
	 * @var bool
	 */
	private $is_user_connected = true;

	/**
	 * Setting up the test.
	 */
	public function set_up() {
		parent::set_up();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);

		Constants::$set_constants['JETPACK__WPCOM_JSON_API_BASE'] = 'https://public-api.wordpress.com';
		$this->is_connected                                       = true;
		$this->is_user_connected                                  = true;

		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10, 2 );
		( new REST_Controller( $this->get_mocked_connection_manager() ) )->register_rest_routes();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10 );

		parent::tear_down();
	}

	/**
	 * Test that the active campaigns endpoint requires admin permission.
	 */
	public function test_active_campaigns_requires_admin_permission() {
		wp_set_current_user( $this->editor_id );

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/blaze/active-campaigns' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Test that the active campaigns endpoint returns active campaign status.
	 */
	public function test_active_campaigns_returns_campaign_status() {
		wp_set_current_user( $this->admin_id );

		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) {
				if ( false !== strpos( $url, '/sites/123/wordads/dsp/api/v1/search/campaigns/site/123' ) ) {
					return array(
						'response' => array( 'code' => 200 ),
						'body'     => wp_json_encode(
							array(
								'campaigns' => array(
									array( 'campaign_id' => 1 ),
								),
							),
							JSON_UNESCAPED_SLASHES
						),
					);
				}

				return $preempt;
			},
			10,
			3
		);

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/blaze/active-campaigns' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'has_active_campaigns' => true,
				'status'               => 'active',
			),
			$response->get_data()
		);

		delete_transient( 'jetpack_blaze_active_campaigns_status_123' );
	}

	/**
	 * Test that the active campaigns endpoint returns an unknown status when the site ID is missing.
	 */
	public function test_active_campaigns_returns_unknown_without_site_id() {
		global $wp_rest_server;

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ), 10 );

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		wp_set_current_user( $this->admin_id );
		( new REST_Controller( $this->get_mocked_connection_manager() ) )->register_rest_routes();

		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/blaze/active-campaigns' );
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'has_active_campaigns' => false,
				'status'               => 'unknown',
			),
			$response->get_data()
		);
	}

	/**
	 * Mock Jetpack site ID and tokens for route registration and API requests.
	 *
	 * @param mixed  $value The option value.
	 * @param string $name  The option name.
	 * @return mixed
	 */
	public function mock_jetpack_site_connection_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return 'blog.token.123';
			case 'id':
				return 123;
			case 'user_tokens':
				$current_user_id = get_current_user_id();
				if ( $current_user_id ) {
					return array(
						$current_user_id => sprintf( 'token%d.secret%d.%d', $current_user_id, $current_user_id, $current_user_id ),
					);
				}
		}

		return $value;
	}

	/**
	 * Create a stubbed Connection_Manager instance.
	 *
	 * @return Connection_Manager PHPUnit stub object.
	 */
	private function get_mocked_connection_manager() {
		$connection_manager = $this->createStub( Connection_Manager::class );
		$connection_manager->method( 'is_connected' )->willReturnCallback(
			function () {
				return $this->is_connected;
			}
		);
		$connection_manager->method( 'is_user_connected' )->willReturnCallback(
			function () {
				return $this->is_user_connected;
			}
		);

		return $connection_manager;
	}
}
