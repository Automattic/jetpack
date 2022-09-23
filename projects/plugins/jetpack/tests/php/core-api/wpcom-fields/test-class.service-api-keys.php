<?php

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Service_API_Keys_Endpoint extends WP_Test_Jetpack_REST_Testcase {

	public static $editor_user_id;
	public static $subscriber_user_id;
	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor_user_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );
		Jetpack_Options::update_option( 'mapbox_api_key', 'ABC' );

		add_filter( 'pre_http_request', array( __CLASS__, 'do_not_verify_mapbox' ), 10, 3 );
	}

	// GET
	public function test_get_services_api_key_mapbox() {
		wp_set_current_user( self::$subscriber_user_id );
		$request  = wp_rest_request( 'GET', '/wpcom/v2/service-api-keys/mapbox' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'success', $data['code'] );
		$this->assertEquals( 'mapbox', $data['service'] );
		$this->assertEquals( 'ABC', $data['service_api_key'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_get_404_services_api_key_unknow_service() {
		wp_set_current_user( self::$editor_user_id );
		$request  = wp_rest_request( 'GET', '/wpcom/v2/service-api-keys/foo' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_service', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	// UPDATE
	public function test_update_services_api_key_mapbox_with_permission() {
		wp_set_current_user( self::$editor_user_id );
		$request = wp_rest_request( 'POST', '/wpcom/v2/service-api-keys/mapbox' );
		$request->set_body_params(
			array(
				'service_api_key' => 'ABC',
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_key', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_update_services_api_key_mapbox_without_permission() {
		wp_set_current_user( self::$subscriber_user_id );
		$request = wp_rest_request( 'POST', '/wpcom/v2/service-api-keys/mapbox' );
		$request->set_body_params(
			array(
				'service_api_key' => 'ABC',
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_user_permission_edit_others_posts', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_update_404_update_services_api_key_unknow_service_with_permission() {
		wp_set_current_user( self::$editor_user_id );
		$request = wp_rest_request( 'POST', '/wpcom/v2/service-api-keys/foo' );
		$request->set_body_params(
			array(
				'service_api_key' => 'ABC',
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_service', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_update_404_services_api_key_unknow_service_without_permission() {
		wp_set_current_user( self::$subscriber_user_id );
		$request = wp_rest_request( 'POST', '/wpcom/v2/service-api-keys/foo' );
		$request->set_body_params(
			array(
				'service_api_key' => 'ABC',
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_user_permission_edit_others_posts', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	// DELETE
	public function test_delete_service_api_key_mapbox_with_permission() {
		wp_set_current_user( self::$editor_user_id );
		$request  = wp_rest_request( 'DELETE', '/wpcom/v2/service-api-keys/mapbox' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'success', $data['code'] );
		$this->assertEquals( 'mapbox', $data['service'] );
		$this->assertSame( '', $data['service_api_key'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_delete_service_api_key_mapbox_without_permission() {
		wp_set_current_user( self::$subscriber_user_id );
		$request  = wp_rest_request( 'DELETE', '/wpcom/v2/service-api-keys/mapbox' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_user_permission_edit_others_posts', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public function test_delete_404_services_api_key_unknow_service_with_permission() {
		wp_set_current_user( self::$editor_user_id );
		$request  = wp_rest_request( 'DELETE', '/wpcom/v2/service-api-keys/foo' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 'invalid_service', $data['code'] );
		$this->assertTrue( isset( $data['message'] ) );
	}

	public static function do_not_verify_mapbox( $return, $r, $url ) {
		// shortcut the api call...
		if ( 'https://api.mapbox.com?ABC' === $url ) {
			return true;
		}
		return $return;
	}
}
