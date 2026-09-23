<?php
/**
 * Tests for the Keyring_Helper class.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Constants;
use Jetpack_Options;
use RuntimeException;
use WorDBless\BaseTestCase;

/**
 * Tests for Keyring_Helper.
 */
class Keyring_Helper_Test extends BaseTestCase {

	/**
	 * Exception message stop_at_redirect() uses. Any other RuntimeException is a real
	 * failure and intercept() rethrows it rather than reporting "did not redirect".
	 */
	private const REDIRECTED = 'Keyring_Helper_Test redirected';

	/**
	 * Where intercept_request() tried to send the browser.
	 *
	 * @var string
	 */
	private $redirected_to = '';

	/**
	 * Body of the XML-RPC request intercept_request() made, if any.
	 *
	 * @var string
	 */
	private $xmlrpc_body = '';

	/**
	 * Services passed to the `connection_disconnected` action.
	 *
	 * @var string[]
	 */
	private $disconnected = array();

	/**
	 * An administrator with a WordPress.com blog ID, which is what a request needs.
	 */
	public function set_up() {
		parent::set_up();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'keyring_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		Jetpack_Options::update_option( 'id', 123 );

		add_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );
		add_filter( 'pre_http_request', array( $this, 'answer_xmlrpc' ), 10, 2 );
		add_action( 'connection_disconnected', array( $this, 'record_disconnect' ) );

		// Without this, a failed nonce check calls wp_die(), which kills the PHP process
		// and silently skips every test after it in this file.
		add_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		remove_filter( 'wp_die_handler', array( $this, 'throw_on_wp_die' ) );
		remove_action( 'connection_disconnected', array( $this, 'record_disconnect' ) );
		remove_filter( 'pre_http_request', array( $this, 'answer_xmlrpc' ), 10 );
		remove_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );
		$_GET     = array();
		$_REQUEST = array();
		delete_option( 'jetpack_private_options' );
		Constants::clear_single_constant( 'JETPACK__API_BASE' );
		Jetpack_Options::delete_option( array( 'id', 'publicize_connections' ) );

		parent::tear_down();
	}

	/**
	 * Record the redirect and stop before the exit() that follows it.
	 *
	 * @param string $location Redirect target.
	 * @return never
	 * @throws RuntimeException Always.
	 */
	public function stop_at_redirect( $location ) {
		$this->redirected_to = $location;

		throw new RuntimeException( self::REDIRECTED );
	}

	/**
	 * Answer the XML-RPC call disconnect() makes, recording what it sent.
	 *
	 * @param mixed $response Short-circuit response.
	 * @param array $args     Request arguments.
	 * @return array
	 */
	public function answer_xmlrpc( $response, $args ) {
		$this->xmlrpc_body = isset( $args['body'] ) ? (string) $args['body'] : '';

		return array(
			'response' => array( 'code' => 200 ),
			'body'     => '<?xml version="1.0"?><methodResponse><params><param><value><string>deleted</string></value></param></params></methodResponse>',
		);
	}

	/**
	 * Record a service name announced as disconnected.
	 *
	 * @param string $service_name Service name.
	 */
	public function record_disconnect( $service_name ) {
		$this->disconnected[] = $service_name;
	}

	/**
	 * Turn wp_die() into an exception instead of ending the process.
	 *
	 * @return callable
	 */
	public function throw_on_wp_die() {
		/**
		 * @param string|\Stringable $message Message passed to wp_die().
		 * @return never
		 * @throws \Exception Always.
		 */
		return static function ( $message ) {
			throw new \Exception( esc_html( (string) $message ) );
		};
	}

	/**
	 * Run intercept_request(), reporting whether it redirected.
	 *
	 * @return bool
	 * @throws RuntimeException Any exception that is not our own redirect signal.
	 */
	private function intercept(): bool {
		$this->redirected_to = '';

		try {
			Keyring_Helper::intercept_request();
		} catch ( RuntimeException $e ) {
			if ( self::REDIRECTED !== $e->getMessage() ) {
				throw $e;
			}

			return true;
		}

		return false;
	}

	/**
	 * Put a URL built by Keyring_Helper back on the request it was meant to arrive on.
	 *
	 * @param string $url URL to take the query arguments from.
	 * @return array
	 */
	private function arrive_at( string $url ): array {
		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$_GET     = $args;
		$_REQUEST = $args;

		return $args;
	}

	/**
	 * Query arguments of the URL intercept_request() redirected to.
	 *
	 * @return array
	 */
	private function redirect_args(): array {
		parse_str( (string) wp_parse_url( $this->redirected_to, PHP_URL_QUERY ), $args );

		return $args;
	}

	public function test_only_google_site_verification_is_offered() {
		$this->assertSame( array( 'google_site_verification' ), array_keys( Keyring_Helper::SERVICES ) );
		$this->assertSame( 'other', Keyring_Helper::SERVICES['google_site_verification']['for'] );
	}

	public function test_connect_url_starts_the_request_from_the_admin_root() {
		$url  = Keyring_Helper::connect_url( 'google_site_verification', 'other' );
		$args = $this->arrive_at( $url );

		$this->assertStringStartsWith( admin_url(), $url );
		$this->assertStringNotContainsString( 'page=sharing', $url );
		$this->assertSame( 'request', $args['action'] );
		$this->assertSame( 'google_site_verification', $args['service'] );
		$this->assertSame( 'other', $args['for'] );
		$this->assertSame( '1', $args['publicize_action'] );
	}

	public function test_request_redirects_to_public_api_without_a_return_page() {
		$this->arrive_at( Keyring_Helper::connect_url( 'google_site_verification', 'other' ) );

		$this->assertTrue( $this->intercept(), 'Expected intercept_request() to redirect to public-api.' );

		$this->assertStringStartsWith( 'https://public-api.wordpress.com/connect/', $this->redirected_to );
		$sent = $this->redirect_args();

		$this->assertSame( 'publicize', $sent['jetpack'] );
		$this->assertSame( 'request', $sent['action'] );
		$this->assertSame( 'google_site_verification', $sent['service'] );
		$this->assertSame( 'other', $sent['for'] );
		$this->assertSame( '123', $sent['blog_id'] );
		$this->assertSame( site_url(), $sent['siteurl'] );
		$this->assertArrayHasKey( 'secret_1', $sent );
		$this->assertArrayHasKey( 'secret_2', $sent );
		$this->assertArrayNotHasKey( 'redirect_uri', $sent );
	}

	/**
	 * SERVICES lists what the site offers to connect, not what intercept_request() accepts:
	 * Publicize::refresh_url() still sends social networks through this same request.
	 */
	public function test_a_service_outside_services_is_still_intercepted() {
		$this->arrive_at( ( new Publicize() )->refresh_url( 'facebook' ) );

		$this->assertTrue( $this->intercept(), 'Expected intercept_request() to redirect to public-api.' );

		$sent = $this->redirect_args();

		$this->assertSame( 'facebook', $sent['service'] );
		$this->assertSame( 'publicize', $sent['for'] );
		$this->assertSame( '123', $sent['blog_id'] );
	}

	public function test_delete_request_removes_the_connection_and_announces_it() {
		update_option( 'jetpack_private_options', array( 'blog_token' => 'blog.token' ) );
		Constants::set_constant( 'JETPACK__API_BASE', 'https://jetpack.wordpress.com/jetpack.' );

		$this->arrive_at( Keyring_Helper::disconnect_url( 'facebook', '42' ) );

		$this->assertFalse( $this->intercept(), 'A delete request should not redirect to public-api.' );

		$this->assertStringContainsString( 'jetpack.deletePublicizeConnection', $this->xmlrpc_body );
		$this->assertStringContainsString( '<string>42</string>', $this->xmlrpc_body );
		$this->assertSame( 'deleted', Jetpack_Options::get_option( 'publicize_connections' ) );
		$this->assertSame( array( 'facebook' ), $this->disconnected );
	}
}
