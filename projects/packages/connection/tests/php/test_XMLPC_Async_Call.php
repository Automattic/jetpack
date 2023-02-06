<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Connection Manager functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use WorDBless\BaseTestCase;

require_once ABSPATH . WPINC . '/IXR/class-IXR-client.php';
/**
 * Connection Manager functionality testing.
 */
class XMLRPC_Async_Call_Test extends BaseTestCase {

	/**
	 * Test add call
	 */
	public function test_add_call() {
		XMLRPC_Async_Call::add_call( 'test', 0, 'test_arg', 'test_arg2' );
		XMLRPC_Async_Call::add_call( 'test', 1, 'test_arg', 'test_arg2' );

		$client_blog_id = is_multisite() ? get_current_blog_id() : 0;

		$this->assertArrayHasKey( $client_blog_id, XMLRPC_Async_Call::$clients );
		$this->assertInstanceOf( 'Jetpack_IXR_ClientMulticall', XMLRPC_Async_Call::$clients[ $client_blog_id ][0] );
		$this->assertInstanceOf( 'Jetpack_IXR_ClientMulticall', XMLRPC_Async_Call::$clients[ $client_blog_id ][1] );

		$this->assertNotEmpty( XMLRPC_Async_Call::$clients[ $client_blog_id ][0]->calls );
		$this->assertEquals( 'test', XMLRPC_Async_Call::$clients[ $client_blog_id ][0]->calls[0]['methodName'] );
		$this->assertEquals( array( 'test_arg', 'test_arg2' ), XMLRPC_Async_Call::$clients[ $client_blog_id ][0]->calls[0]['params'] );

		$this->assertEquals( 10, has_action( 'shutdown', array( 'Automattic\Jetpack\Connection\XMLRPC_Async_Call', 'do_calls' ) ) );
	}

}
