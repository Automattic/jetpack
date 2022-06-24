<?php

use Automattic\Jetpack\Connection\Tokens;

class WP_Test_Jetpack_XMLRPC_Server extends WP_UnitTestCase {

	public static $xmlrpc_admin = 0;

	public static function wpSetupBeforeClass( $factory ) {
		$user_id = $factory->user->create();
		$user    = get_user_by( 'ID', $user_id );
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
		$this->assertStringContainsString( '[local_user_missing]', $response->message );
	}

	/**
	 * Test test_remote_provision_error_nonexistent_user
	 */
	public function test_remote_provision_error_nonexistent_user() {
		$server   = new Jetpack_XMLRPC_Server();
		$response = $server->remote_provision( array() );

		$this->assertInstanceOf( 'IXR_Error', $response );
		$this->assertStringContainsString( 'local_user_missing', $response->message );

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

		$this->assertIsArray( $response );

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

	/**
	 * Test remote_provision filter is working and adding the onboarding token.
	 */
	public function test_remote_provision_onboarding_filter() {
		$request  = array(
			'local_user' => 1,
			'onboarding' => 1,
		);
		$response = ( new Jetpack_XMLRPC_Server() )->remote_provision( $request );

		$this->assertArrayHasKey( 'onboarding_token', $response, 'onboard_token should be present in the response.' );
		$this->assertNotEmpty( $response['onboarding_token'], 'onboard_token should not be empty.' );
	}

	/**
	 * Test remote_provision filter is not adding onboard_token when it is not supposed to
	 */
	public function test_remote_provision_onboarding_filter_unchanged() {
		$request  = array(
			'local_user' => 1,
		);
		$response = ( new Jetpack_XMLRPC_Server() )->remote_provision( $request );

		$this->assertArrayNotHasKey( 'onboarding_token', $response, 'onboard_token should not be present in the response.' );
	}

	/**
	 * Asserts that the jetpack_remote_connect_end is properly hooked
	 */
	public function test_remote_connect_hook() {

		$xml = $this->getMockBuilder( 'Jetpack_IXR_Client' )
			->setMethods(
				array(
					'query',
					'isError',
					'getResponse',
				)
			)
			->getMock();

		$xml->expects( $this->exactly( 1 ) )
			->method( 'query' )
			->will( $this->returnValue( 'sadlkjdasd.sadlikdj' ) );

		$xml->expects( $this->exactly( 1 ) )
			->method( 'isError' )
			->will( $this->returnValue( empty( $error ) ? false : true ) );

		$xml->expects( $this->exactly( 1 ) )
			->method( 'getResponse' )
			->will( $this->returnValue( 'asdadsasd' ) );

		$server = new Jetpack_XMLRPC_Server();

		$this->assertSame( 10, has_action( 'jetpack_remote_connect_end', array( 'Jetpack_XMLRPC_Methods', 'remote_connect_end' ) ), 'Action jetpack_remote_connect_end not hooked' );

		$server->remote_connect(
			array(
				'nonce'      => '1234',
				'local_user' => self::$xmlrpc_admin,
			),
			$xml
		);

		$this->assertSame( 1, did_action( 'jetpack_remote_connect_end' ), 'Action was not fired' );

	}

	/**
	 * Tests if the remote_register redirect uri is being filtered
	 */
	public function test_remote_register_redirect_uri_filter() {
		$request = array(
			'local_user' => 1,
		);

		// The filter should modify the URI because there's no Connection owner.  (see conditions in Jetpack_XMLRPC_Methods::remote_register_redirect_uri).
		$response     = ( new Jetpack_XMLRPC_Server() )->remote_provision( $request );
		$expected_uri = Jetpack_XMLRPC_Methods::remote_register_redirect_uri( 'dummy' );

		$this->assertNotSame( 'dummy', $expected_uri );
		$this->assertSame( $expected_uri, $response['redirect_uri'] );
	}

	/**
	 * Tests if the remote_register redirect uri is not being filtered when conditions do not apply
	 */
	public function test_remote_register_redirect_uri_filter_not_applied() {
		$request = array(
			'local_user' => 1,
		);

		( new Tokens() )->update_user_token( 1, 'asd.qwe.1', true );

		// The filter should not modify the URI because there's a Connection owner and sso is not enabled. (see conditions in Jetpack_XMLRPC_Methods::remote_register_redirect_uri).
		$response         = ( new Jetpack_XMLRPC_Server() )->remote_provision( $request );
		$not_expected_uri = Jetpack_XMLRPC_Methods::remote_register_redirect_uri( 'dummy' );

		$this->assertSame( 'dummy', $not_expected_uri );
		$this->assertNotSame( $not_expected_uri, $response['redirect_uri'] );
	}

}
