<?php
/**
 * Tests for the Keyring_Helper class.
 *
 * @package automattic/jetpack-publicize
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Publicize;

use Jetpack_Options;
use RuntimeException;
use WorDBless\BaseTestCase;

/**
 * Tests for Keyring_Helper.
 */
class Keyring_Helper_Test extends BaseTestCase {

	/**
	 * Where intercept_request() tried to send the browser.
	 *
	 * @var string
	 */
	private $redirected_to = '';

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
	}

	/**
	 * Undo set_up().
	 */
	public function tear_down() {
		remove_filter( 'wp_redirect', array( $this, 'stop_at_redirect' ) );
		$_GET     = array();
		$_REQUEST = array();
		Jetpack_Options::delete_option( 'id' );

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

		throw new RuntimeException( 'redirected' );
	}

	/**
	 * Run intercept_request(), reporting whether it redirected.
	 */
	private function intercept() {
		try {
			Keyring_Helper::intercept_request();
		} catch ( RuntimeException $e ) {
			return 'redirected' === $e->getMessage();
		}

		return false;
	}

	/**
	 * Google site verification is the only service left in the constant.
	 */
	public function test_only_google_site_verification_is_offered() {
		$this->assertSame( array( 'google_site_verification' ), array_keys( Keyring_Helper::SERVICES ) );
		$this->assertSame( 'other', Keyring_Helper::SERVICES['google_site_verification']['for'] );
	}

	/**
	 * A connection request starts from the admin root, not from Settings > Sharing.
	 */
	public function test_connect_url_starts_the_request_from_the_admin_root() {
		$url = Keyring_Helper::connect_url( 'google_site_verification', 'other' );
		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );

		$this->assertStringStartsWith( admin_url(), $url );
		$this->assertStringNotContainsString( 'page=sharing', $url );
		$this->assertSame( 'request', $args['action'] );
		$this->assertSame( 'google_site_verification', $args['service'] );
		$this->assertSame( 'other', $args['for'] );
		$this->assertSame( '1', $args['publicize_action'] );
	}

	/**
	 * The request public-api receives names no return page.
	 */
	public function test_request_redirects_to_public_api_without_a_return_page() {
		$url = Keyring_Helper::connect_url( 'google_site_verification', 'other' );
		parse_str( (string) wp_parse_url( $url, PHP_URL_QUERY ), $args );
		$_GET     = $args;
		$_REQUEST = $args;

		$this->assertTrue( $this->intercept(), 'Expected intercept_request() to redirect to public-api.' );

		$this->assertStringStartsWith( 'https://public-api.wordpress.com/connect/', $this->redirected_to );
		parse_str( (string) wp_parse_url( $this->redirected_to, PHP_URL_QUERY ), $sent );

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
}
