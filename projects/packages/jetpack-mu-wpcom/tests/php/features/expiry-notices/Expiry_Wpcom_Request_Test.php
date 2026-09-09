<?php
/**
 * Expiry_Wpcom_Request Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-wpcom-request.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Wpcom_Request
 */
#[CoversClass( Expiry_Wpcom_Request::class )]
class Expiry_Wpcom_Request_Test extends \WorDBless\BaseTestCase {

	/**
	 * @var array<int,string>
	 */
	private $requested = array();

	/**
	 * @var mixed
	 */
	private $response;

	public function set_up() {
		parent::set_up();
		\Jetpack_Options::update_option( 'id', 12345 );
		\Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		// Without this the client has no API host to sign a URL for, and
		// refuses the request before the HTTP stand-in below sees it.
		Connection_Utils::init_default_constants();
		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		\Jetpack_Options::delete_option( 'id' );
		\Jetpack_Options::delete_option( 'blog_token' );
		parent::tear_down();
	}

	/**
	 * Stand in for WordPress.com.
	 *
	 * @param mixed  $pre  Short-circuit value.
	 * @param array  $args Request arguments.
	 * @param string $url  Request URL.
	 * @return mixed
	 */
	public function answer( $pre, $args, $url ) {
		$this->requested[] = $url;
		return $this->response;
	}

	public function test_decodes_the_body_of_a_successful_read(): void {
		$this->response = array(
			'response' => array( 'code' => 200 ),
			'body'     => '[{"ID":"1","user_id":777}]',
		);

		$body = Expiry_Wpcom_Request::get_as_blog( '/upgrades?site=12345' );

		$this->assertIsArray( $body );
		$this->assertSame( 777, $body[0]->user_id );
		$this->assertCount( 1, $this->requested );
		$this->assertStringContainsString( '/rest/v1.2/upgrades?site=12345', $this->requested[0] );
	}

	public function test_a_failed_read_is_null(): void {
		$this->response = array(
			'response' => array( 'code' => 403 ),
			'body'     => '{"error":"unauthorized"}',
		);
		$this->assertNull( Expiry_Wpcom_Request::get_as_blog( '/upgrades?site=12345' ) );

		$this->response = new \WP_Error( 'http_request_failed', 'timed out' );
		$this->assertNull( Expiry_Wpcom_Request::get_as_blog( '/upgrades?site=12345' ) );
	}

	public function test_a_site_without_an_id_asks_nothing(): void {
		\Jetpack_Options::delete_option( 'id' );
		$this->assertNull( Expiry_Wpcom_Request::get_as_blog( '/upgrades?site=12345' ) );
		$this->assertSame( array(), $this->requested );
	}
}
