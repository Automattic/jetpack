<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use WP_Error;

/**
 * Unit tests for the WPCOM_Client class.
 *
 * @package automattic/jetpack-stats-admin
 */
class WPCOM_Client_Test extends Stats_TestCase {
	/**
	 * Without a blog token the request never leaves the site. The error says so, and carries a
	 * status, so the REST API does not report it as a server fault.
	 */
	public function test_request_as_blog_without_a_connection() {
		$this->disconnect_site();

		$response = WPCOM_Client::request_as_blog( '/sites/0/stats' );

		$this->assertInstanceOf( WP_Error::class, $response );
		$this->assertSame( 'site_not_connected', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data()['status'] );
	}
}
