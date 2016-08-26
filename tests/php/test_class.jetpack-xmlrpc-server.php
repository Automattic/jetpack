<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-xmlrpc-server.php';

class WP_Test_Jetpack_XMLRPC_Server extends WP_UnitTestCase {
	function test_xmlrpc_features_available() {
		$server = new Jetpack_XMLRPC_Server();
		$response = $server->features_available();
		
		// trivial assertion
		$this->assertTrue( in_array( 'publicize', $response ) );
	}

	function test_xmlrpc_get_sync_object() {
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
}
	