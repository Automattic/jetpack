<?php
/**
 * Expiry_Wpcom Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices;

use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/class-expiry-wpcom.php';

/**
 * @covers \Automattic\Jetpack\Jetpack_Mu_Wpcom\Expiry_Notices\Expiry_Wpcom
 */
#[CoversClass( Expiry_Wpcom::class )]
class Expiry_Wpcom_Test extends \WorDBless\BaseTestCase {

	const CACHE_KEY = 'wpcom_expiry_notices_test_answer';

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
		// Without this the client has no API host to sign a URL for.
		Connection_Utils::init_default_constants();
		add_filter( 'pre_http_request', array( $this, 'answer' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'answer' ), 10 );
		delete_transient( self::CACHE_KEY );
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

		$body = Expiry_Wpcom::get_as_blog( '/upgrades?site=%d' );

		$this->assertSame( 777, $body[0]->user_id );
		$this->assertCount( 1, $this->requested );
		$this->assertStringContainsString( '/rest/v1.2/upgrades?site=12345', $this->requested[0] );
	}

	public function test_a_failed_read_is_null(): void {
		$this->response = array(
			'response' => array( 'code' => 403 ),
			'body'     => '{"error":"unauthorized"}',
		);
		$this->assertNull( Expiry_Wpcom::get_as_blog( '/upgrades?site=%d' ) );

		$this->response = new \WP_Error( 'http_request_failed', 'timed out' );
		$this->assertNull( Expiry_Wpcom::get_as_blog( '/upgrades?site=%d' ) );
	}

	public function test_a_site_without_an_id_asks_nothing(): void {
		\Jetpack_Options::delete_option( 'id' );
		$this->assertNull( Expiry_Wpcom::get_as_blog( '/upgrades?site=%d' ) );
		$this->assertSame( array(), $this->requested );
	}

	public function test_remembers_an_answer_for_hours_and_a_failure_for_minutes(): void {
		$lookups = 0;
		$answer  = null;
		$lookup  = static function () use ( &$lookups, &$answer ) {
			++$lookups;
			return $answer;
		};
		$twice   = static function () use ( $lookup ): array {
			return array( Expiry_Wpcom::remember( self::CACHE_KEY, $lookup ), Expiry_Wpcom::remember( self::CACHE_KEY, $lookup ) );
		};
		$ttl     = static function (): int {
			return (int) get_option( '_transient_timeout_' . self::CACHE_KEY ) - time();
		};

		$this->assertSame( array( null, null ), $twice() );
		$this->assertSame( 1, $lookups );
		$this->assertLessThanOrEqual( Expiry_Wpcom::FAILURE_TTL, $ttl() );

		delete_transient( self::CACHE_KEY );
		$answer = 'example.wordpress.com';
		$this->assertSame( array( $answer, $answer ), $twice() );
		$this->assertSame( 2, $lookups );
		$this->assertGreaterThan( Expiry_Wpcom::FAILURE_TTL, $ttl() );

		// A resolved "nothing" is an answer too, and is kept as one.
		delete_transient( self::CACHE_KEY );
		$answer = '';
		$this->assertSame( array( '', '' ), $twice() );
		$this->assertSame( 3, $lookups );
	}
}
