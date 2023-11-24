<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Brain\Monkey;
use Brain\Monkey\Actions;
use WorDBless\BaseTestCase;

/**
 * Unit tests for the Server_Sandbox class.
 *
 * @package automattic/jetpack-connection
 */
class Test_Server_Sandbox extends BaseTestCase {

	use \Mockery\Adapter\Phpunit\MockeryPHPUnitIntegration;

	/**
	 * Set up.
	 */
	public function set_up() {
		Monkey\setUp();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Monkey\tearDown();
		Constants::clear_constants();
	}

	/**
	 * Test that init() adds action callbacks only once, regardless of how many times init() is called.
	 */
	public function test_init() {
		Actions\expectAdded( 'requests-requests.before_request' );
		( new Server_Sandbox() )->init();

		// The requests-requests.before_request action callback should be added only once.
		Actions\expectAdded( 'requests-requests.before_request' )->never();
		( new Server_Sandbox() )->init();
	}

	/**
	 * Test the server_sandbox_request_parameters() method.
	 *
	 * @param string $sandbox         The sandbox url.
	 * @param string $url             The request url.
	 * @param array  $headers         The request headers.
	 * @param array  $expected_output The expected output.
	 *
	 * @dataProvider data_provider_test_server_sandbox_request_parameters
	 */
	public function test_server_sandbox_request_parameters( $sandbox, $url, $headers, $expected_output ) {
		$result = ( new Server_Sandbox() )->server_sandbox_request_parameters( $sandbox, $url, $headers );
		$this->assertSame( $expected_output, $result );
	}

	/**
	 * Data provider for test_server_sandbox_request_parameters. Provide test data with the format:
	 * { test description } =>
	 *     'sandbox' => { sandbox url },
	 *     'url'     => { request url },
	 *     'headers' => { An array containing the request headers },
	 *     'output'  => { An array containing the expected output of the server_sandbox_request_parameters() }
	 */
	public function data_provider_test_server_sandbox_request_parameters() {
		return array(
			'sandbox not a string'                   => array(
				'sandbox' => 123,
				'url'     => 'https://public-api.wordpress.com/test',
				'headers' => array(
					'Host' => 'example.com',
				),
				'output'  => array(
					'url'           => 'https://public-api.wordpress.com/test',
					'host'          => '',
					'new_signature' => '',
				),
			),
			'url not a string'                       => array(
				'sandbox' => 'example.com',
				'url'     => 123,
				'headers' => array(
					'Host' => 'example.com',
				),
				'output'  => array(
					'url'           => 123,
					'host'          => '',
					'new_signature' => '',
				),
			),
			'sandbox, url valid, no host in headers' => array(
				'sandbox' => 'example.com',
				'url'     => 'https://public-api.wordpress.com/test',
				'headers' => array(),
				'output'  => array(
					'url'           => 'https://example.com/test',
					'host'          => 'public-api.wordpress.com',
					'new_signature' => '',
				),
			),
			'sandbox, url valid, host in headers'    => array(
				'sandbox' => 'example.com',
				'url'     => 'https://public-api.wordpress.com/test',
				'headers' => array(
					'Host' => 'example.com',
				),
				'output'  => array(
					'url'           => 'https://example.com/test',
					'host'          => 'example.com',
					'new_signature' => '',
				),
			),
			'sandbox, url valid, host not wpcom'     => array(
				'sandbox' => 'example.com',
				'url'     => 'https://wordpress.org/test',
				'headers' => array(),
				'output'  => array(
					'url'           => 'https://wordpress.org/test',
					'host'          => '',
					'new_signature' => '',
				),
			),
		);
	}

	/**
	 * Test the server_sandbox_request_parameters() method.
	 *
	 * @param string $sandbox_constant The sandbox url.
	 * @param string $url              The request url.
	 * @param array  $expected_url     The value of $url after calling server_sandbox().
	 * @param array  $expected_headers The value of $headers after calling server_sandbox().
	 *
	 * @dataProvider data_provider_test_server_sandbox
	 */
	public function test_server_sandbox( $sandbox_constant, $url, $expected_url, $expected_headers ) {
		Constants::set_constant( 'JETPACK__SANDBOX_DOMAIN', $sandbox_constant );
		$headers = array();

		ini_set( 'error_log', '/dev/null' );
		try {
			( new Server_Sandbox() )->server_sandbox( $url, $headers );
		} finally {
			ini_restore( 'error_log' );
		}

		$this->assertSame( $expected_url, $url );
		$this->assertSame( $expected_headers, $headers );
	}

	/**
	 * Data provider for test_server_sandbox_request_parameters. Provide test data with the format:
	 * { test description } =>
	 *     'constant'         => { sandbox url },
	 *     'url'              => { request url },
	 *     'expected_url'     => { The value of $url after calling server_sandbox() },
	 *     'expected_headers' => { The value of $headers after calling server_sandbox() }
	 */
	public function data_provider_test_server_sandbox() {
		return array(
			'constant not set'                => array(
				'constant'         => '',
				'url'              => 'https://public-api.wordpress.com/test',
				'expected_url'     => 'https://public-api.wordpress.com/test',
				'expected_headers' => array(),
			),
			'constant set, sandboxed url'     => array(
				'constant'         => 'example.com',
				'url'              => 'https://public-api.wordpress.com/test',
				'expected_url'     => 'https://example.com/test',
				'expected_headers' => array(
					'Host' => 'public-api.wordpress.com',
				),
			),
			'constant set, not sandboxed url' => array(
				'constant'         => 'example.com',
				'url'              => 'https://wordpress.org/test',
				'expected_url'     => 'https://wordpress.org/test',
				'expected_headers' => array(),
			),
		);
	}

	/**
	 * Test the server_sandbox_request_parameters() with XDEBUG param.
	 *
	 * @param string $url              The request url.
	 * @param array  $expected_url     The value of $url after calling server_sandbox().
	 * @param bool   $add_filter Whether to add the XDEBUG filter or not.
	 *
	 * @dataProvider data_provider_test_server_sandbox_with_xdebug
	 */
	public function test_server_sandbox_with_xdebug( $url, $expected_url, $add_filter = true ) {
		Constants::set_constant( 'JETPACK__SANDBOX_DOMAIN', 'example.com' );
		( new Tokens() )->update_blog_token( 'asdasd.qweqwe' );

		$body      = 'bbooddyy';
		$body_hash = base64_encode( sha1( $body, true ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		$method    = 'GET';
		$timestamp = time();
		$headers   = array(
			'Authorization' => 'X_JETPACK signature="$ignature#" token="asdasd:1:0" timestamp="' . $timestamp . '" nonce="qweasd" body-hash="' . $body_hash . '"',
		);

		if ( $add_filter ) {
			add_filter( 'jetpack_sandbox_add_profile_parameter', '__return_true' );
		}

		ini_set( 'error_log', '/dev/null' );
		try {
			( new Server_Sandbox() )->server_sandbox( $url, $headers, $body, $method );
		} finally {
			ini_restore( 'error_log' );
		}

		$this->assertSame( $expected_url, $url );

		if ( $add_filter ) {
			$headers_vars = ( new Server_Sandbox() )->extract_authorization_headers( $headers );
			$this->assertNotEmpty( $headers_vars['signature'] );
			$this->assertNotSame( '$ignature#', $headers_vars['signature'] );
			remove_filter( 'jetpack_sandbox_add_profile_parameter', '__return_true' );
		}
	}

	/**
	 * Data provider for test_server_sandbox_with_xdebug
	 *
	 * @return array
	 */
	public function data_provider_test_server_sandbox_with_xdebug() {
		return array(
			'not filtered'         => array(
				'url'          => 'https://public-api.wordpress.com/test',
				'expected_url' => 'https://example.com/test',
				'add_filter'   => false,
			),
			'filtered'             => array(
				'url'          => 'https://public-api.wordpress.com/test',
				'expected_url' => 'https://example.com/test?XDEBUG_PROFILE=1',
			),
			'filtered with params' => array(
				'url'          => 'https://public-api.wordpress.com/test?param=1',
				'expected_url' => 'https://example.com/test?param=1&XDEBUG_PROFILE=1',
			),
		);
	}

	/**
	 * Test that the admin_bar_add_sandbox_item() method does not add the 'jetpack-connection-api-sandbox' item to the
	 * admin bar menu when the JETPACK__DOMAIN_SANDBOX constant is not set.
	 */
	public function test_admin_bar_add_sandbox_item_constant_not_set() {
		require_once dirname( __DIR__, 2 ) . '/wordpress/wp-includes/class-wp-admin-bar.php';

		$wp_admin_bar = new \WP_Admin_Bar();
		( new Server_Sandbox() )->admin_bar_add_sandbox_item( $wp_admin_bar );

		$this->assertEmpty( $wp_admin_bar->get_nodes() );
		$this->assertNull( $wp_admin_bar->get_node( 'jetpack-connection-api-sandbox' ) );
	}

	/**
	 * Test that the admin_bar_add_sandbox_item() method adds the 'jetpack-connection-api-sandbox' item to the admin
	 * bar menu when the JETPACK__DOMAIN_SANDBOX constant is set.
	 */
	public function test_admin_bar_add_sandbox_item_constant_set() {
		Constants::set_constant( 'JETPACK__SANDBOX_DOMAIN', 'www.example.com' );
		require_once dirname( __DIR__, 2 ) . '/wordpress/wp-includes/class-wp-admin-bar.php';

		$wp_admin_bar = new \WP_Admin_Bar();
		( new Server_Sandbox() )->admin_bar_add_sandbox_item( $wp_admin_bar );

		$this->assertCount( 1, $wp_admin_bar->get_nodes() );
		$this->assertNotNull( $wp_admin_bar->get_node( 'jetpack-connection-api-sandbox' ) );
	}

	/**
	 * Tests the extract_authorization_headers method
	 *
	 * @param mixed $headers The method input.
	 * @param mixed $expected The expected output.
	 * @return void
	 *
	 * @dataProvider data_provider_test_extract_authorization_headers
	 */
	public function test_extract_authorization_headers( $headers, $expected ) {
		$this->assertSame( $expected, ( new Server_Sandbox() )->extract_authorization_headers( $headers ) );
	}

	/**
	 * Data provider for test_extract_authorization_headers
	 *
	 * @return array
	 */
	public function data_provider_test_extract_authorization_headers() {
		return array(
			'happy_case'          => array(
				array(
					'Authorization' => 'X_JETPACK var1="value1" var2="value2"',
				),
				array(
					'var1' => 'value1',
					'var2' => 'value2',
				),
			),
			'invalid_array'       => array(
				array(
					'foo' => 'bar',
				),
				null,
			),
			'var without value'   => array(
				array(
					'Authorization' => 'X_JETPACK var1="value1" var2="value2" var3',
				),
				array(
					'var1' => 'value1',
					'var2' => 'value2',
				),
			),
			'var with equal sign' => array(
				array(
					'Authorization' => 'X_JETPACK var1="val=ue1" var2="value2="',
				),
				array(
					'var1' => 'val=ue1',
					'var2' => 'value2=',
				),
			),
			'empty header'        => array(
				array(
					'Authorization' => '',
				),
				null,
			),
			'not string header'   => array(
				array(
					'Authorization' => false,
				),
				null,
			),
			'array header'        => array(
				array(
					'Authorization' => array( 123, 456 ),
				),
				null,
			),
		);
	}
}
