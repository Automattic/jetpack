<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-xmlrpc-server.php';

class WP_Test_Jetpack_XMLRPC_Server extends WP_UnitTestCase {
	function test_xmlrpc_features_available() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->features_available();

		// trivial assertion
		$this->assertTrue( in_array( 'publicize', $response ) );
	}

	function test_xmlrpc_get_sync_object_for_post() {
		$post_id = $this->factory->post->create();

		$server = new Jetpack_XMLRPC_Server();
		$response = $server->sync_object( array( 'posts', 'post', $post_id ) );

		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertEquals( $post_id, $decoded_object->ID );
	}

	function test_xmlrpc_sync_object_returns_false_if_missing() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->sync_object( array( 'posts', 'post', 1000 ) );

		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertFalse( $decoded_object );
	}

	function test_xmlrpc_get_sync_object_for_user() {
		$user_id = $this->factory->user->create();

		$server = new Jetpack_XMLRPC_Server();
		$response = $server->sync_object( array( 'users', 'user', $user_id ) );

		$codec = Jetpack_Sync_Sender::get_instance()->get_codec();
		$decoded_object = $codec->decode( $response );

		$this->assertFalse( isset( $decoded_object->user_pass ) );

		$this->assertEquals( $user_id, $decoded_object->ID );
	}

	function test_xmlrpc_remote_provision_fails_no_nonce() {
		$server = new Jetpack_XMLRPC_Server();

		$response = $server->remote_provision( array( 'local_username' => 'nonexistent' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[nonce_missing]', $response->message );
	}

	function test_xmlrpc_remote_provision_fails_no_local_username() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array( 'nonce' => '12345' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[local_username_missing]', $response->message );
	}

	function test_xmlrpc_remote_provision_fails_nonce_validation() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array( 'nonce' => '12345', 'local_username' => 'nonexistent' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[invalid_nonce]', $response->message );
	}

	function test_xmlrpc_remote_provision_nonce_validation() {
		$server = new Jetpack_XMLRPC_Server();
		$filters = array(
			'__return_ok_status' => array(
				'code' => 404,
				'message' => 'user_unknown', // Signifies the nonce was valid.
			),
			'__return_invalid_nonce_status' => array(
				'code' => 400,
				'message' => 'invalid_nonce',
			),
			'__return_nonce_404_status' => array(
				'code' => 400,
				'message' => 'invalid_nonce',
			),
		);

		foreach ( $filters as $filter => $expected ) {
			add_filter( 'pre_http_request', array( $this, $filter ) );
			$response = $server->remote_provision( array( 'nonce' => '12345', 'local_username' => 'nonexistent' ) );
			remove_filter( 'pre_http_request', array( $this, $filter ) );

			$this->assertInstanceOf( 'IXR_Error', $response );
			$this->assertEquals( $expected['code'], $response->code );
			$this->assertContains( sprintf( '[%s]', $expected['message'] ), $response->message );
		}
	}

	/*
	 * Helpers
	 */

	public function __return_ok_status() {
		return array(
			'body' => 'OK',
			'response' => array(
				'code'    => 200,
				'message' => '',
			)
		);
	}

	public function __return_invalid_nonce_status() {
		return array(
			'body' => 'FAIL: NOT OK',
			'response' => array(
				'code'    => 200,
				'message' => '',
			)
		);
	}

	public function __return_nonce_404_status() {
		return array(
			'body' => '',
			'response' => array(
				'code'    => 404,
				'message' => '',
			)
		);
	}
}
