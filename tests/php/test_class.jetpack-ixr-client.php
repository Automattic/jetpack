<?php

class WP_Test_Jetpack_IXR_Client extends WP_UnitTestCase {

	public function tearDown() {
		parent::tearDown();
		unset( $_SERVER['HTTP_USER_AGENT'] );
	}


	public function test_jetpack_client_recieves_unknown_token_disconnect_blog() {

		add_filter( 'http_response', array( $this, 'return_unknown_token_error' ) );
		$master_user = $this->create_and_set_master_user( false );
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.monitor.isActive' );
		remove_filter('http_response', array( $this, 'return_unknown_token_error' ) );

		$this->assertFalse( Jetpack_Options::get_option( 'master_user' ) , 'Master user present' );
		$this->assertFalse( Jetpack_Options::get_option( 'user_tokens' ), 'User Tokens Present' );
		$this->assertFalse( Jetpack_Options::get_option( 'blog_token' ), 'Blog Token Present');
	}

	public function test_jetpack_client_recieves_unknown_token_demote_master_user() {

		add_filter( 'http_response', array( $this, 'return_unknown_token_error' ) );
		$master_user = $this->create_and_set_master_user( true );
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id()
		) );
		$xml->query( 'jetpack.monitor.isActive' );
		remove_filter('http_response', array( $this, 'return_unknown_token_error' ) );

		$master_user_new = Jetpack_Options::get_option( 'master_user' );
		$this->assertTrue(  $master_user !== $master_user_new , 'Master Not switched present' );
		$tokens = Jetpack_Options::get_option( 'user_tokens' );

		$this->assertFalse( isset( $tokens[$master_user] ), 'Master Token Present');
		$this->assertTrue(  isset( $tokens[$master_user_new] ), 'New Master Token Present' );
		$this->assertTrue( (bool)Jetpack_Options::get_option( 'blog_token' ), 'Blog Token Not Present' );

	}

	public function create_and_set_master_user( $another_connected_admin ) {
		$master_user = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$tokens = array(
			$master_user     => 'kiwi.a.' . $master_user
		);
		if ( $another_connected_admin ) {
			$other_connected_admin = $this->factory->user->create( array( 'role' => 'administrator' ) );
			$tokens[$other_connected_admin] = 'apple.a.' . $other_connected_admin;
		}

		Jetpack_Options::update_option( 'master_user', $master_user );
		Jetpack_Options::update_option( 'user_tokens', $tokens );
		Jetpack_Options::update_option( 'blog_token', 'kiwi.banana' );
		return $master_user;
	}

	public function return_unknown_token_error( $response ) {

		$requests_response = new Requests_Response();
		return array(
			'headers' => new Requests_Utility_CaseInsensitiveDictionary( $response, null ),
			'body' => '<?xml version="1.0" encoding="UTF-8"?>
<methodResponse>
  <fault>
    <value>
      <struct>
        <member>
          <name>faultCode</name>
          <value><int>401</int></value>
        </member>
        <member>
          <name>faultString</name>
          <value><string>Jetpack: [unknown_token] It looks like your Jetpack connection is broken.  Try disconnecting from WordPress.com then reconnecting.</string></value>
        </member>
      </struct>
    </value>
  </fault>
</methodResponse>',
			'response' => array(
				'code' => 200,
				'message' => 'OK',
			),
			'cookies' => array(),
			'http_response' => new WP_HTTP_Requests_Response( $requests_response ),
		);
	}
}
