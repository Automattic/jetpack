<?php
/**
 * Tests for the Urls class.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Urls class.
 *
 * @covers \Automattic\Jetpack\Connection\Urls
 */
#[CoversClass( Urls::class )]
class Urls_Test extends BaseTestCase {

	/**
	 * The original $_SERVER superglobal.
	 *
	 * @var array
	 */
	private $original_server;

	/**
	 * Start each test with no web request.
	 */
	public function set_up() {
		parent::set_up();

		$this->original_server = $_SERVER;
		unset( $_SERVER['HTTP_HOST'], $_SERVER['HTTPS'], $_SERVER['SERVER_PORT'] );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$_SERVER = $this->original_server;
		Constants::clear_constants();

		parent::tear_down();
	}

	/**
	 * Without a web request, the scheme comes from the stored URL or the history, which stays unchanged.
	 *
	 * @dataProvider no_web_request_provider
	 *
	 * @param string   $constant Constant set by the command-line context, `DOING_CRON` or `WP_CLI`.
	 * @param string   $stored   Scheme of the stored URL.
	 * @param string[] $history  Existing scheme history.
	 * @param string   $expected Expected scheme of the returned URL.
	 */
	#[DataProvider( 'no_web_request_provider' )]
	public function test_scheme_without_a_web_request( $constant, $stored, $history, $expected ) {
		Constants::set_constant( $constant, true );
		Constants::set_constant( 'WP_HOME', $stored . '://example.com' );
		update_option( Urls::HTTPS_CHECK_OPTION_PREFIX . 'home_url', $history );

		$this->assertSame( $expected . '://example.com', Urls::home_url() );
		$this->assertSame( $history, get_option( Urls::HTTPS_CHECK_OPTION_PREFIX . 'home_url' ) );
	}

	/**
	 * Data provider for test_scheme_without_a_web_request.
	 *
	 * @return array[]
	 */
	public static function no_web_request_provider() {
		return array(
			'CLI cron, stored http, https in history' => array( 'DOING_CRON', 'http', array( 'https', 'http' ), 'https' ),
			'CLI cron, stored http, http history'     => array( 'DOING_CRON', 'http', array( 'http' ), 'http' ),
			'WP-CLI, stored https, http history'      => array( 'WP_CLI', 'https', array( 'http' ), 'https' ),
		);
	}

	/**
	 * A web request without a Host header still records its scheme, so a client can't opt out of the history.
	 */
	public function test_web_request_without_host_header_records_scheme() {
		Constants::set_constant( 'WP_HOME', 'https://example.com' );
		update_option( Urls::HTTPS_CHECK_OPTION_PREFIX . 'home_url', array( 'http' ) );

		$this->assertSame( 'http://example.com', Urls::home_url() );
		$this->assertSame( array( 'http', 'http' ), get_option( Urls::HTTPS_CHECK_OPTION_PREFIX . 'home_url' ) );
	}
}
