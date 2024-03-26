<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST API endpoints.
 *
 * @package automattic/jetpack-stats
 * @see \Automattic\Jetpack\Stats\REST_Provider
 */
class Test_REST_Provider extends TestCase {
	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	const BLOG_TOKEN = 'new.blogtoken';
	const BLOG_ID    = 42;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		REST_Provider::init( true );
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();

		Connection_Rest_Authentication::init()->reset_saved_auth_state();
	}

	/**
	 * Testing the `remote_provision` endpoint without authentication.
	 * Response: failed authorization.
	 */
	public function test_get_blog_unauthenticated() {
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/stats/blog' );
		$request->set_header( 'Content-Type', 'application/json' );

		// Mock full connection established.
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10, 2 );

		$response      = $this->server->dispatch( $request );
		$response_data = $response->get_data();

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10 );

		static::assertEquals( 'invalid_permission_stats_get_blog', $response_data['code'] );
		static::assertEquals( 401, $response_data['data']['status'] );
	}

	/**
	 * Testing the `remote_provision` endpoint with proper authentication.
	 * We intentionally provide an invalid user ID so the `Jetpack_XMLRPC_Server::remote_provision()` would trigger an error.
	 * Response: `input_error`, meaning that the REST endpoint passed the data to the handler.
	 */
	public function test_get_blog_authenticated() {
		wp_set_current_user( 0 );

		// Mock full connection established.
		add_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10, 2 );

		$_SERVER['REQUEST_METHOD'] = 'POST';

		$_GET['_for']      = 'jetpack';
		$_GET['token']     = 'new:1:0';
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';
		$_GET['body-hash'] = '';
		// This is intentionally using base64_encode().
		// phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		// phpcs:disable WordPress.Security.ValidatedSanitizedInput
		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					$data  = array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						$_GET['body-hash'],
						'POST',
						'anything.example',
						'80',
						'',
					)
				) . "\n",
				'blogtoken',
				true
			)
		);
		// phpcs:enable WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		// phpcs:enable WordPress.Security.ValidatedSanitizedInput

		Connection_Rest_Authentication::init()->wp_rest_authenticate( false );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/stats/blog' );
		$request->set_header( 'Content-Type', 'application/json' );

		$response      = $this->server->dispatch( $request );
		$response_data = $response->get_data();

		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_options' ), 10 );

		$expected_stats_blog = array(
			'admin_bar'                => true,
			'count_roles'              => array(),
			'do_not_track'             => true,
			'version'                  => Main::STATS_VERSION,
			'collapse_nudges'          => false,
			'enable_odyssey_stats'     => true,
			'odyssey_stats_changed_at' => 0,
			'notices'                  => array(),
			'views'                    => 0,
			'host'                     => 'example.org',
			'path'                     => '/',
			'blogname'                 => false,
			'blogdescription'          => false,
			'siteurl'                  => 'http://example.org',
			'gmt_offset'               => false,
			'timezone_string'          => false,
			'stats_version'            => Main::STATS_VERSION,
			'stats_api'                => 'jetpack',
			'page_on_front'            => false,
			'permalink_structure'      => false,
			'category_base'            => false,
			'tag_base'                 => false,
		);

		$this->assertSame( $expected_stats_blog, $response_data );
	}

	/**
	 * Intercept the `Jetpack_Options` call and mock the values.
	 * Full connection set-up.
	 *
	 * @param mixed  $value The current option value.
	 * @param string $name Option name.
	 *
	 * @return mixed
	 */
	public function mock_jetpack_options( $value, $name ) {
		switch ( $name ) {
			case 'blog_token':
				return self::BLOG_TOKEN;
			case 'id':
				return self::BLOG_ID;
		}

		return $value;
	}
}
