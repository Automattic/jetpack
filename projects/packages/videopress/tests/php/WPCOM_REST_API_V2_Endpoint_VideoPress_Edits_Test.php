<?php
/**
 * Tests for the VideoPress editing proxy.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WP_Error;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Covers authorization, request validation, and upstream error propagation.
 */
class WPCOM_REST_API_V2_Endpoint_VideoPress_Edits_Test extends BaseTestCase {

	/** @var array|WP_Error Mock upstream response. */
	private $upstream_response;

	/** @var array Captured outbound requests. */
	private $requests = array();

	/** @var int Attachment owner ID. */
	private $owner_id;

	/**
	 * Set up the connected owner, video, and REST server.
	 */
	public function setUp(): void {
		parent::setUp();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$this->owner_id = $this->login_as( 'author' );
		$post_id        = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => 'video/videopress',
				'post_author'    => $this->owner_id,
			)
		);
		// WorDBless does not emulate the resolver's meta query.
		set_transient( 'videopress_get_post_id_by_guid_AbCd1234', $post_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_AbCd1234', 'videopress' );

		$this->upstream_response = array(
			'response' => array( 'code' => 200 ),
			'body'     => wp_json_encode(
				array(
					'guid'     => 'AbCd1234',
					'revision' => 0,
				),
				JSON_UNESCAPED_SLASHES
			),
		);
		add_filter( 'pre_http_request', array( $this, 'mock_http' ), 10, 3 );
		add_filter( 'jetpack_videopress_trim_cut', '__return_true' );
		$this->register_routes();
	}

	/**
	 * Clear connection and per-video caches.
	 */
	public function tearDown(): void {
		wp_set_current_user( 0 );
		Constants::clear_single_constant( 'JETPACK__WPCOM_JSON_API_BASE' );
		\Jetpack_Options::delete_option( 'blog_token' );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'master_user' );
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
		delete_transient( 'videopress_get_post_id_by_guid_AbCd1234' );
		wp_cache_delete( 'get_post_by_guid_AbCd1234', 'videopress' );
		$GLOBALS['wp_rest_server'] = null;
		parent::tearDown();
	}

	/**
	 * Capture transport arguments without sending a request.
	 *
	 * @param mixed  $preempt Existing preempted response.
	 * @param array  $args HTTP arguments.
	 * @param string $url Request URL.
	 * @return array|WP_Error
	 */
	public function mock_http( $preempt, $args, $url ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->requests[] = array(
			'url'  => $url,
			'args' => $args,
		);
		return $this->upstream_response;
	}

	/**
	 * Connect a user with the requested role.
	 *
	 * @param string $role WordPress role.
	 * @return int User ID.
	 */
	private function login_as( $role ) {
		$id = wp_insert_user(
			array(
				'user_login' => uniqid( 'editor_', true ),
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $id );
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'master_user', $id );
		( new Tokens() )->update_user_token( $id, sprintf( 'key.private.%d', $id ), false );
		( new Connection_Manager() )->reset_connection_status();
		return $id;
	}

	/**
	 * Create a fresh server with the current feature gate.
	 */
	private function register_routes() {
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		$endpoint                  = new WPCOM_REST_API_V2_Endpoint_VideoPress_Edits();
		do_action( 'rest_api_init' );
		$endpoint->register_routes();
	}

	/**
	 * Dispatch a request through validation and permissions.
	 *
	 * @param string     $method HTTP method.
	 * @param array|null $body JSON body.
	 * @param string     $suffix Route suffix.
	 * @return \WP_REST_Response
	 */
	private function dispatch( $method = 'GET', $body = null, $suffix = 'edits' ) {
		$request = new WP_REST_Request( $method, '/wpcom/v2/videopress/AbCd1234/' . $suffix );
		if ( null !== $body ) {
			$request->set_header( 'content-type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Test the feature gate blocks route registration.
	 */
	public function test_disabled_feature_has_no_routes() {
		remove_filter( 'jetpack_videopress_trim_cut', '__return_true' );
		$this->register_routes();
		$this->assertSame( 404, $this->dispatch()->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/**
	 * @dataProvider denied_users
	 * @param string $role User role; empty means logged out.
	 * @param int    $status Expected status.
	 */
	#[DataProvider( 'denied_users' )]
	public function test_other_users_cannot_access_original_or_edit_video( $role, $status ) {
		if ( $role ) {
			$this->login_as( $role );
		} else {
			wp_set_current_user( 0 );
		}
		foreach ( array( 'GET', 'POST', 'DELETE' ) as $method ) {
			$response = $this->dispatch(
				$method,
				'POST' === $method ? array(
					'base_revision' => 0,
					'operations'    => array(),
				) : null
			);
			$this->assertSame( $status, $response->get_status() );
		}
		$this->assertSame( $status, $this->dispatch( 'GET', null, 'storyboard' )->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/** @return array User permission cases. */
	public static function denied_users() {
		return array( array( '', 401 ), array( 'subscriber', 403 ), array( 'contributor', 403 ), array( 'author', 403 ) );
	}

	/**
	 * Test owners can read their video and obtain storyboard data.
	 */
	public function test_owner_can_read_edits_and_storyboard() {
		$response = $this->dispatch();
		$this->assertSame( 200, $response->get_status(), var_export( $response->get_data(), true ) );
		$this->assertStringContainsString( '/rest/v1.1/videos/AbCd1234/edits', $this->requests[0]['url'] );
		$this->assertSame( 200, $this->dispatch( 'GET', null, 'storyboard' )->get_status() );
		$this->assertStringContainsString( '/rest/v1.1/videos/AbCd1234/storyboard', $this->requests[1]['url'] );
	}

	/**
	 * Test saves send only the validated operation payload.
	 */
	public function test_save_forwards_operations_and_preserves_accepted_status() {
		$this->upstream_response['response']['code'] = 202;
		$body                                        = array(
			'base_revision' => 2,
			'operations'    => array(
				array(
					'type'     => 'trim',
					'start_ms' => 1000,
					'end_ms'   => 5000,
				),
			),
		);
		$this->assertSame( 202, $this->dispatch( 'POST', $body + array( 'unrelated' => 'ignored' ) )->get_status() );
		$this->assertSame( 'POST', $this->requests[0]['args']['method'] );
		$this->assertSame( $body, json_decode( $this->requests[0]['args']['body'], true ) );
	}

	/**
	 * Test restoring maps DELETE to the upstream POST deletion route.
	 */
	public function test_restore_uses_post_delete_route() {
		$this->dispatch( 'DELETE' );
		$this->assertSame( 'POST', $this->requests[0]['args']['method'] );
		$this->assertStringContainsString( '/rest/v1.1/videos/AbCd1234/edits/delete', $this->requests[0]['url'] );
	}

	/**
	 * Copy requests forward the idempotency key without unrelated parameters.
	 */
	public function test_copy_forwards_request_and_status_routes() {
		$request_id                                  = 'a1b2c3d4-1234-4567-890a-b1c2d3e4f567';
		$body                                        = array(
			'base_revision' => 2,
			'operations'    => array(),
			'request_id'    => $request_id,
			'title'         => 'A new video',
		);
		$this->upstream_response['response']['code'] = 202;
		$this->assertSame( 202, $this->dispatch( 'POST', $body + array( 'unrelated' => 'ignored' ), 'edits/copy' )->get_status() );
		$this->assertSame( $body, json_decode( $this->requests[0]['args']['body'], true ) );
		$this->assertStringContainsString( '/rest/v1.1/videos/AbCd1234/edits/copy', $this->requests[0]['url'] );
		$this->assertStringContainsString( 'token="key:1:' . $this->owner_id . '"', $this->requests[0]['args']['headers']['Authorization'] );
		$this->dispatch( 'GET', null, 'edits/copy/' . $request_id );
		$this->assertStringContainsString( '/rest/v1.1/videos/AbCd1234/edits/copy/' . $request_id, $this->requests[1]['url'] );
		$this->assertStringContainsString( 'token="asdasd:1:0"', $this->requests[1]['args']['headers']['Authorization'] );
	}

	/** A missing creator connection cannot fall back to the blog token for a copy. */
	public function test_copy_requires_the_initiating_users_token() {
		\Jetpack_Options::delete_option( 'user_tokens' );
		( new Connection_Manager() )->reset_connection_status();
		$response = $this->dispatch(
			'POST',
			array(
				'base_revision' => 0,
				'operations'    => array(),
				'request_id'    => 'a1b2c3d4-1234-4567-890a-b1c2d3e4f567',
			),
			'edits/copy'
		);
		$this->assertSame( 403, $response->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/**
	 * Invalid idempotency keys fail before contacting WordPress.com.
	 */
	public function test_copy_requires_a_valid_request_uuid() {
		$body = array(
			'base_revision' => 0,
			'operations'    => array(),
			'request_id'    => 'invalid',
		);
		$this->assertSame( 400, $this->dispatch( 'POST', $body, 'edits/copy' )->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/**
	 * Copy endpoints use the same per-video authorization as updates.
	 */
	public function test_copy_rejects_other_authors() {
		$this->login_as( 'author' );
		$body = array(
			'base_revision' => 0,
			'operations'    => array(),
			'request_id'    => 'a1b2c3d4-1234-4567-890a-b1c2d3e4f567',
		);
		$this->assertSame( 403, $this->dispatch( 'POST', $body, 'edits/copy' )->get_status() );
		$this->assertSame( 403, $this->dispatch( 'GET', null, 'edits/copy/' . $body['request_id'] )->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/**
	 * @dataProvider invalid_payloads
	 * @param array $body Invalid JSON payload.
	 */
	#[DataProvider( 'invalid_payloads' )]
	public function test_invalid_payload_is_rejected_before_proxying( $body ) {
		$this->assertSame( 400, $this->dispatch( 'POST', $body )->get_status() );
		$this->assertEmpty( $this->requests );
	}

	/** @return array Invalid payload cases. */
	public static function invalid_payloads() {
		return array(
			array( array( 'operations' => array() ) ),
			array(
				array(
					'base_revision' => -1,
					'operations'    => array(),
				),
			),
			array( array( 'base_revision' => 0 ) ),
			array(
				array(
					'base_revision' => 0,
					'operations'    => array(
						array(
							'type'     => 'crop',
							'start_ms' => 0,
							'end_ms'   => 1000,
						),
					),
				),
			),
			array(
				array(
					'base_revision' => 0,
					'operations'    => array(
						array(
							'type'     => 'trim',
							'start_ms' => 1.5,
							'end_ms'   => 1000,
						),
					),
				),
			),
			array(
				array(
					'base_revision' => 0,
					'operations'    => array(
						array(
							'type'     => 'cut',
							'start_ms' => 0,
						),
					),
				),
			),
		);
	}

	/**
	 * Test conflicts retain the upstream revision and status in REST format.
	 */
	public function test_conflict_response_retains_revision() {
		$this->upstream_response = array(
			'response' => array( 'code' => 409 ),
			'body'     => wp_json_encode(
				array(
					'error'   => 'edits_conflict',
					'message' => 'Changed elsewhere.',
					'data'    => array( 'current_revision' => 3 ),
				),
				JSON_UNESCAPED_SLASHES
			),
		);
		$response                = $this->dispatch(
			'POST',
			array(
				'base_revision' => 0,
				'operations'    => array(),
			)
		);
		$this->assertSame( 409, $response->get_status() );
		$this->assertEquals(
			array(
				'code'    => 'edits_conflict',
				'message' => 'Changed elsewhere.',
				'data'    => array(
					'current_revision' => 3,
					'status'           => 409,
				),
			),
			$response->get_data()
		);
	}

	/**
	 * Test transport failures remain errors.
	 */
	public function test_transport_failure_returns_bad_gateway() {
		$this->upstream_response = new WP_Error( 'timeout', 'Connection timed out.' );
		$this->assertSame( 502, $this->dispatch()->get_status() );
	}

	/**
	 * Test non-JSON successes do not reach the editor as a valid empty state.
	 */
	public function test_invalid_json_returns_bad_gateway() {
		$this->upstream_response['body'] = '<html>Service unavailable</html>';
		$this->assertSame( 502, $this->dispatch()->get_status() );
	}

	/**
	 * WordPress.com must use its local service adapter instead of the v2-only direct client.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_dispatches_all_edit_actions_locally() {
		define( 'IS_WPCOM', true );
		$endpoint = new WPCOM_REST_API_V2_Endpoint_VideoPress_Edits();
		$request  = new WP_REST_Request();
		$request->set_param( 'guid', 'AbCd1234' );
		$request->set_param( 'base_revision', 2 );
		$request->set_param( 'operations', array() );
		$request->set_param( 'request_id', 'a1b2c3d4-1234-4567-890a-b1c2d3e4f567' );
		$request->set_param( 'title', 'Edited copy' );

		$unavailable = $endpoint->get_edits( $request );
		$this->assertInstanceOf( WP_Error::class, $unavailable );
		$this->assertSame( array( 'status' => 503 ), $unavailable->get_error_data() );

		$received = array();
		$response = new \WP_REST_Response( array( 'guid' => 'AbCd1234' ), 202 );
		add_filter(
			'jetpack_videopress_local_edit_request',
			static function ( $default, $path, $method, $body ) use ( &$received, $response ) {
				$received[] = array( $path, $method, $body );
				return $response;
			},
			10,
			4
		);
		foreach ( array( 'get_edits', 'get_storyboard', 'save_edits', 'restore_original', 'copy_edits', 'get_copy' ) as $callback ) {
			$this->assertSame( $response, $endpoint->$callback( $request ) );
		}
		$this->assertSame(
			array(
				array( 'videos/AbCd1234/edits', 'GET', null ),
				array( 'videos/AbCd1234/storyboard', 'GET', null ),
				array(
					'videos/AbCd1234/edits',
					'POST',
					array(
						'base_revision' => 2,
						'operations'    => array(),
					),
				),
				array( 'videos/AbCd1234/edits/delete', 'POST', null ),
				array(
					'videos/AbCd1234/edits/copy',
					'POST',
					array(
						'base_revision' => 2,
						'operations'    => array(),
						'request_id'    => $request['request_id'],
						'title'         => 'Edited copy',
					),
				),
				array( 'videos/AbCd1234/edits/copy/' . $request['request_id'], 'GET', null ),
			),
			$received
		);
		$this->assertSame( array(), $this->requests );
	}

	/**
	 * Test WordPress.com's endpoint-only bootstrap includes the editing routes.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcom_partial_bootstrap_registers_edit_routes() {
		define( 'IS_WPCOM', true );
		\Brain\Monkey\Functions\when( 'wpcom_rest_api_v2_load_plugin' )->alias(
			static function ( $class ) {
				return new $class();
			}
		);
		remove_all_actions( 'rest_api_init' );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();

		require __DIR__ . '/../../src/class-wpcom-rest-api-v2-endpoint-videopress.php';
		do_action( 'rest_api_init' );

		$this->assertArrayHasKey(
			'/wpcom/v2/videopress/(?P<guid>[A-Za-z0-9]{8})/edits',
			rest_get_server()->get_routes()
		);
	}
}
