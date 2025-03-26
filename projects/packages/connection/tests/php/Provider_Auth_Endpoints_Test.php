<?php
/**
 * Tests for the provider-specific authentication endpoints.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Heartbeat;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the provider-specific authentication endpoints.
 */
class Provider_Auth_Endpoints_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The Connection Manager instance.
	 *
	 * @var Manager
	 */
	private $connection;

	/**
	 * The REST Connector instance.
	 *
	 * @var REST_Connector
	 */
	private $rest_connector;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		global $wp_rest_server;

		// Suppress deprecation warning for urlencode(null)
		error_reporting( E_ALL & ~E_DEPRECATED );

		// Define required constants
		Constants::$set_constants['JETPACK__API_BASE'] = 'https://jetpack.wordpress.com/jetpack.';

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		// Initialize REST routes properly
		do_action( 'rest_api_init' );
		$this->rest_connector = new REST_Connector( new Manager() );
		Heartbeat::init()->initialize_rest_api();

		// Create an admin user and set as current.
		$user = wp_create_user( 'admin', 'admin', 'admin@example.com' );
		wp_set_current_user( $user );
		$user = wp_get_current_user();
		$user->add_cap( 'jetpack_connect_user' );

		set_transient( 'jetpack_assumed_site_creation_date', '2025-03-21 00:00:000' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		delete_transient( 'jetpack_assumed_site_creation_date' );
	}

	/**
	 * Test getting authorization URL without authentication.
	 */
	public function test_get_provider_auth_url_no_auth() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/google' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
		$this->assertEquals( 'invalid_user_permission_user_connection_data', $response->get_data()['code'] );
	}

	/**
	 * Test getting authorization URL with invalid provider.
	 */
	public function test_get_provider_auth_url_invalid_provider() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/invalid' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Test getting Google authorization URL.
	 */
	public function test_get_google_auth_url() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/google' );
		$request->set_param( 'redirect_uri', '/wp-admin/admin.php?page=jetpack' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'authorizeUrl', $data );
		$this->assertStringContainsString( 'wordpress.com/log-in/jetpack/google', $data['authorizeUrl'] );
		$this->assertStringContainsString( 'redirect_uri', $data['authorizeUrl'] );
	}

	/**
	 * Test getting magic link authorization URL without email.
	 */
	public function test_get_magic_link_auth_url_without_email() {
		$request  = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/link' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'missing_email', $response->get_data()['code'] );
	}

	/**
	 * Test getting magic link authorization URL with invalid email.
	 */
	public function test_get_magic_link_auth_url_invalid_email() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/link' );
		$request->set_param( 'email_address', 'invalid-email' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
		$this->assertEquals( 'rest_invalid_param', $response->get_data()['code'] );
	}

	/**
	 * Test getting magic link authorization URL with valid email.
	 */
	public function test_get_magic_link_auth_url() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/link' );
		$request->set_param( 'email_address', 'test@example.com' );
		$request->set_param( 'auto_trigger', true );
		$request->set_param( 'redirect_uri', '/wp-admin/admin.php?page=jetpack' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'authorizeUrl', $data );
		$this->assertStringContainsString( 'wordpress.com/log-in/jetpack/link', $data['authorizeUrl'] );
		$this->assertStringContainsString( 'email_address=test%40example.com', $data['authorizeUrl'] );
		$this->assertStringContainsString( 'auto_trigger=1', $data['authorizeUrl'] );
		$this->assertStringContainsString( 'redirect_uri', $data['authorizeUrl'] );
	}

	/**
	 * Test URL construction maintains necessary Jetpack parameters.
	 */
	public function test_auth_url_preserves_jetpack_params() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/google' );
		$request->set_param( 'redirect_uri', '/wp-admin/admin.php?page=jetpack' );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$url  = $data['authorizeUrl'];

		// Check that essential Jetpack parameters are preserved
		// The parameters are embedded within the encoded redirect_to URL
		$decoded_url = urldecode( $url );
		$this->assertStringContainsString( 'state=', $decoded_url );
		$this->assertStringContainsString( 'secret=', $decoded_url );
		$this->assertStringContainsString( 'redirect_uri=', $decoded_url );
	}

	/**
	 * Test URL construction maintains necessary Jetpack parameters for magic link.
	 */
	public function test_auth_url_preserves_jetpack_params_magic_link() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/connection/authorize_url/link' );
		$request->set_param( 'redirect_uri', '/wp-admin/admin.php?page=jetpack' );
		$request->set_param( 'email_address', 'test@example.com' );
		$response = $this->server->dispatch( $request );

		$data = $response->get_data();
		$url  = $data['authorizeUrl'];

		// Check that essential Jetpack parameters are preserved
		// The parameters are embedded within the encoded redirect_to URL
		$decoded_url = urldecode( $url );
		$this->assertStringContainsString( 'state=', $decoded_url );
		$this->assertStringContainsString( 'secret=', $decoded_url );
		$this->assertStringContainsString( 'redirect_uri=', $decoded_url );
		$this->assertStringContainsString( 'email_address=', $decoded_url );
		$this->assertStringContainsString( 'auto_trigger=1', $decoded_url );
	}

	/**
	 * Test getting authorization URL for each supported provider.
	 *
	 * @dataProvider provider_auth_url_provider
	 * @param string $provider The authentication provider.
	 */
	public function test_provider_auth_urls( $provider ) {
		$request = new WP_REST_Request( 'GET', "/jetpack/v4/connection/authorize_url/{$provider}" );
		$request->set_param( 'redirect_uri', '/wp-admin/admin.php?page=jetpack' );

		if ( $provider === 'link' ) {
			$request->set_param( 'email_address', 'test@example.com' );
		}

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();

		$this->assertArrayHasKey( 'authorizeUrl', $data );
		$this->assertStringContainsString( "wordpress.com/log-in/jetpack/{$provider}", $data['authorizeUrl'] );
	}

	/**
	 * Data provider for test_provider_auth_urls.
	 *
	 * @return array Test data.
	 */
	public static function provider_auth_url_provider() {
		return array(
			'google provider' => array( 'google' ),
			'github provider' => array( 'github' ),
			'apple provider'  => array( 'apple' ),
			'link provider'   => array( 'link' ),
		);
	}
}
