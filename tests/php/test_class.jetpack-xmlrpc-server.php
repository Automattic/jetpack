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

	function test_xmlrpc_remote_register_fails_no_nonce() {
		$server = new Jetpack_XMLRPC_Server();

		$response = $server->remote_register( array( 'local_user' => '1' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[nonce_missing]', $response->message );
	}

	function test_xmlrpc_remote_provision_fails_no_local_user() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array( 'nonce' => '12345' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[local_user_missing]', $response->message );
	}

	function test_xmlrpc_remote_register_nonce_validation() {
		$server = new Jetpack_XMLRPC_Server();
		$filters = array(
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
			$response = $server->remote_register( array( 'nonce' => '12345', 'local_user' => '1' ) );
			remove_filter( 'pre_http_request', array( $this, $filter ) );

			$this->assertInstanceOf( 'IXR_Error', $response );
			$this->assertEquals( $expected['code'], $response->code );
			$this->assertContains( sprintf( '[%s]', $expected['message'] ), $response->message );
		}
	}

	function test_successful_remote_register_return() {
		$server = new Jetpack_XMLRPC_Server();

		$blog_token = Jetpack_Options::get_option( 'blog_token' );
		$id         = Jetpack_Options::get_option( 'id' );

		// Set these so that we don't try to register unnecessarily.
		Jetpack_Options::update_option( 'blog_token', 1 );
		Jetpack_Options::update_option( 'id', 1001 );

		add_filter( 'pre_http_request', array( $this, '__return_ok_status' ) );
		$response = $server->remote_register( array( 'nonce' => '12345', 'local_user' => '1' ) );
		remove_filter( 'pre_http_request', array( $this, '__return_ok_status' ) );

		$this->assertInternalType( 'array', $response );
		$this->assertArrayHasKey( 'client_id', $response );
		$this->assertEquals( 1001, $response['client_id'] );
	}

	function test_remote_provision_error_nonexistent_user() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array() );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertContains( 'local_user_missing', $response->message );

		$response = $server->remote_provision( array( 'local_user' => 'nonexistent' ) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 'Jetpack: [input_error] Valid user is required', $response->message );
	}

	function test_remote_provision_success() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array( 'local_user' => 1 ) );

		$this->assertInternalType( 'array', $response );

		$expected_keys = array(
			'jp_version',
			'redirect_uri',
			'user_id',
			'user_email',
			'user_login',
			'scope',
			'secret',
			'is_active',
		);

		foreach ( $expected_keys as $key ) {
			$this->assertArrayHasKey( $key, $response );
		}
	}

	public function test_remote_connect_error_when_site_active() {
		// Simulate the site being active.
		Jetpack_Options::update_options( array(
			'blog_token'  => 1,
			'id'          => 1001,
		) );
		Jetpack::update_user_token( 1, sprintf( '%s.%d', 'token', 1 ), true );

		$server = new Jetpack_XMLRPC_Server();

		$response = $server->remote_connect( array(
			'nonce'      => '1234',
			'local_user' => '1',
		) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertObjectHasAttribute( 'code', $response );
		$this->assertObjectHasAttribute( 'message', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertEquals(
			'Jetpack: [token_fetch_failed] Failed to fetch user token from WordPress.com.',
			$response->message
		);

		foreach ( array( 'blog_token', 'id','master_user', 'user_tokens' ) as $option_name ) {
			Jetpack_Options::delete_option( $option_name );
		}
	}

	public function test_remote_connect_error_invalid_user() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_connect( array(
			'nonce'      => '1234',
			'local_user' => '100000000',
		) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertObjectHasAttribute( 'code', $response );
		$this->assertObjectHasAttribute( 'message', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertEquals(
			'Jetpack: [input_error] Valid user is required.',
			$response->message
		);
	}

	public function test_remote_connect_empty_nonce() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->remote_connect( array(
			'local_user' => '1',
		) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertObjectHasAttribute( 'code', $response );
		$this->assertObjectHasAttribute( 'message', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertEquals(
			'Jetpack: [input_error] A non-empty nonce must be supplied.',
			$response->message
		);
	}

	public function test_remote_connect_fails_no_blog_token() {
		Jetpack_Options::delete_option( 'blog_token' );

		$server = new Jetpack_XMLRPC_Server();

		add_filter( 'pre_http_request', array( $this, '__return_token' ) );
		$response = $server->remote_connect( array(
			'nonce'      => '1234',
			'local_user' => '1',
		) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertObjectHasAttribute( 'code', $response );
		$this->assertObjectHasAttribute( 'message', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertEquals(
			'Jetpack: [token_fetch_failed] Failed to fetch user token from WordPress.com.',
			$response->message
		);
	}

	public function test_remote_connect_nonce_validation_error() {
		Jetpack_Options::update_options( array(
			'id'         => 1001,
			'blog_token' =>  '123456.123456',
		) );

		$server = $this->get_mocked_xmlrpc_server();
		$response = $server->remote_connect( array(
			'nonce'      => '1234',
			'local_user' => '1',
		), $this->get_mocked_ixr_client( true, false ) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertObjectHasAttribute( 'code', $response );
		$this->assertObjectHasAttribute( 'message', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertEquals(
			'Jetpack: [token_fetch_failed] Failed to fetch user token from WordPress.com.',
			$response->message
		);
	}

	public function test_remote_connect_success() {
		Jetpack_Options::update_options( array(
			'id'         => 1001,
			'blog_token' =>  '123456.123456',
		) );

		$server = $this->get_mocked_xmlrpc_server();
		$response = $server->remote_connect( array(
			'nonce'      => '1234',
			'local_user' => '1',
		), $this->get_mocked_ixr_client( true, 'this_is.a_token' ) );

		$this->assertTrue( $response );
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

	protected function get_mocked_ixr_client( $query_called = false, $response = '', $query_return = true, $error = null ) {
		Jetpack::load_xml_rpc_client();
		$xml = $this->getMockBuilder( 'Jetpack_IXR_Client' )
			->setMethods( array(
				'query',
				'isError',
				'getResponse',
			) )
			->getMock();

		$xml->expects( $this->exactly( $query_called ? 1 : 0 ) )
			->method( 'query' )
			->will( $this->returnValue( $query_return ) );

		$xml->expects( $this->exactly( $query_called ? 1 : 0 ) )
			->method( 'isError' )
			->will( $this->returnValue( empty( $error ) ? false : true ) );

		$xml->expects( $this->exactly( empty( $error ) ? 1 : 0 ) )
			->method( 'getResponse' )
			->will( $this->returnValue( $response ) );

		return $xml;
	}

	protected function get_mocked_xmlrpc_server() {
		$server = $this->getMockBuilder( 'Jetpack_XMLRPC_Server' )
			->setMethods( array(
				'do_post_authorization',
			) )
			->getMock();

		$server->expects( $this->any() )
			->method( 'do_post_authorization' )
			->will( $this->returnValue( true ) );

		return $server;
	}
}
