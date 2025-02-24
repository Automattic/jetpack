<?php

require_once dirname( __DIR__, 2 ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Tests for JITM V2 REST API Endpoints.
 *
 * @package automattic/jetpack
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_JITM_V2 extends WP_Test_Jetpack_REST_Testcase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();
		wp_set_current_user( static::$user_id );
	}

	/**
	 * Tests the schema response for OPTIONS requests.
	 */
	public function test_schema_request() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'OPTIONS', '/wpcom/v2/jitm-v2' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'wpcom/v2', $data['namespace'] );
		$this->assertEquals( array( 'GET', 'POST' ), $data['methods'] );
	}

	/**
	 * Tests the permission check for GET requests.
	 */
	public function test_get_item_permissions_check() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/wpcom/v2/jitm-v2' );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'Unauthenticated users should be able to get JITMs' );
	}

	/**
	 * Tests the permission check for POST (dismiss) requests.
	 */
	public function test_dismiss_item_permissions_check() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/jitm-v2' );
		$request->set_body_params(
			array(
				'id'            => 'test-jitm',
				'feature_class' => 'test-feature',
			)
		);

		// Test with no user (should fail)
		wp_set_current_user( 0 );
		$response = $this->server->dispatch( $request );
		$this->assertErrorResponse( 'invalid_user_permission_jetpack_delete_jitm_message', $response, rest_authorization_required_code() );

		// Test with subscriber (should succeed)
		$subscriber_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber_id );
		$response = $this->server->dispatch( $request );
		$this->assertEquals( 200, $response->get_status(), 'Subscribers should be able to dismiss JITMs' );
	}

	/**
	 * Tests getting JITMs.
	 */
	public function test_get_jitms() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/jitm-v2' );
		$request->set_query_params(
			array(
				'message_path'        => 'test_message_path',
				'query'               => '',
				'full_jp_logo_exists' => false,
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertIsArray( $data );
	}

	/**
	 * Tests dismissing a JITM.
	 */
	public function test_dismiss_jitm() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/jitm-v2' );
		$request->set_body_params(
			array(
				'id'            => 'test-jitm',
				'feature_class' => 'test-feature',
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertTrue( $data );
	}
}
