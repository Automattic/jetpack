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
	 * @param bool     $is_wp_cli Whether WP-CLI is running, with a host set as by its `--url` argument.
	 * @param string   $stored    Scheme of the stored URL.
	 * @param string[] $history   Existing scheme history.
	 * @param string   $expected  Expected scheme of the returned URL.
	 */
	#[DataProvider( 'no_web_request_provider' )]
	public function test_scheme_without_a_web_request( $is_wp_cli, $stored, $history, $expected ) {
		if ( $is_wp_cli ) {
			Constants::set_constant( 'WP_CLI', true );
			$_SERVER['HTTP_HOST'] = 'example.com';
		}
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
			'no host, stored http, https in history' => array( false, 'http', array( 'https', 'http' ), 'https' ),
			'no host, stored http, http history'     => array( false, 'http', array( 'http' ), 'http' ),
			'WP-CLI, stored https, http history'     => array( true, 'https', array( 'http' ), 'https' ),
		);
	}
}
