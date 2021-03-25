<?php

use Automattic\Jetpack\Connection\Tokens;

class WP_Test_Jetpack_XMLRPC_Server extends WP_UnitTestCase {
	static $xmlrpc_admin = 0;

	public static function wpSetupBeforeClass( $factory ) {
		$user_id = $factory->user->create();
		$user = get_user_by( 'ID', $user_id );
		$user->set_role( 'administrator' );
		( new Tokens() )->update_user_token( $user_id, sprintf( '%s.%s.%d', 'key', 'private', $user_id ), false );

		self::$xmlrpc_admin = $user_id;
	}

	/**
	 * Tests that the Jetpack plugin XMLRPC methods are being added
	 *
	 * @param string $method The XMLRPC method name.
	 *
	 * @dataProvider data_xmlrpc_methods_exist
	 */
	public function test_xmlrpc_methods_exist( $method ) {
		$methods = ( new Jetpack_XMLRPC_Server() )->xmlrpc_methods( array() );
		$this->assertArrayHasKey( $method, $methods );
	}

	/**
	 * Data provider for test_xmlrpc_methods_exist
	 */
	public function data_xmlrpc_methods_exist() {
		return array(
			array( 'jetpack.featuresAvailable' ),
			array( 'jetpack.featuresEnabled' ),
			array( 'jetpack.disconnectBlog' ),
			array( 'jetpack.jsonAPI' ),
			array( 'jetpack.remoteProvision' ),
		);
	}

	/**
	 * Test test_xmlrpc_features_available
	 */
	public function test_xmlrpc_features_available() {
		$response = Jetpack_XMLRPC_Methods::features_available();

		// trivial assertion.
		$this->assertContains( 'publicize', $response );
	}

	/**
	 * Test test_xmlrpc_remote_provision_fails_no_local_user
	 *
	 * @return void
	 */
	public function test_xmlrpc_remote_provision_fails_no_local_user() {
		$server   = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array( 'nonce' => '12345' ) );
		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 400, $response->code );
		$this->assertContains( '[local_user_missing]', $response->message );
	}

	/**
	 * Test test_remote_provision_error_nonexistent_user
	 */
	public function test_remote_provision_error_nonexistent_user() {
		$server   = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array() );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertContains( 'local_user_missing', $response->message );

		$response = $server->remote_provision( array( 'local_user' => 'nonexistent' ) );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertEquals( 'Jetpack: [input_error] Valid user is required', $response->message );
	}

	/**
	 * Test test_remote_provision_success
	 */
	public function test_remote_provision_success() {
		$server   = new Jetpack_XMLRPC_Server();
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

}
