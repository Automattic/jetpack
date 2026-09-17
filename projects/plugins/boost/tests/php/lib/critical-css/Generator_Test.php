<?php
/**
 * Tests for the Critical CSS Generator class.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Lib\Critical_CSS\Generator;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Class Generator_Test
 */
class Generator_Test extends BaseTestCase {

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		unset( $_GET[ Generator::GENERATE_QUERY_ACTION ] );
		remove_all_filters( 'wp_redirect' );
		remove_all_filters( 'wp_redirect_status' );
		remove_all_filters( 'wp_die_handler' );
		remove_all_filters( 'login_url' );
		remove_all_actions( 'wp_head' );
		remove_all_filters( 'show_admin_bar' );
		parent::tear_down();
	}

	/**
	 * Initialize the generator as it runs on a front-end request.
	 *
	 * @param bool $generating Whether the request is a Critical CSS generation request.
	 */
	private function init_request( $generating ) {
		if ( $generating ) {
			$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';
		}
		Generator::init();
	}

	public function test_generation_request_login_redirect_terminates_without_rendering() {
		$this->init_request( true );
		$requested      = home_url( '/private-page/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000' );
		$redirect_count = 0;
		$rendered       = false;
		add_filter(
			'wp_redirect_status',
			function ( $status ) use ( &$redirect_count ) {
				++$redirect_count;
				return $status;
			}
		);
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					throw new \RuntimeException( $message, $args['response'] );
				};
			}
		);

		foreach ( array( true, false ) as $reauth ) {
			try {
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Exercise the redirect interface used by auth_redirect().
				wp_redirect( wp_login_url( $requested, $reauth ) );
				$rendered = true;
				$this->fail( 'The login redirect must terminate generation.' );
			} catch ( \RuntimeException $error ) {
				$this->assertSame( 403, $error->getCode() );
			}
		}

		$this->assertSame( 0, $redirect_count );
		$this->assertFalse( $rendered );
	}

	public function test_custom_login_redirect_requires_matching_endpoint_and_query() {
		$this->init_request( true );
		$homepage = set_url_scheme( home_url( '/' ), 'https' );
		$login    = $homepage . '?login=1';
		add_filter(
			'login_url',
			function () use ( $login ) {
				return $login;
			}
		);
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					throw new \RuntimeException( $message, $args['response'] );
				};
			}
		);

		foreach (
			array(
				$homepage,
				$homepage . '?login=0',
				set_url_scheme( $login, 'http' ),
				'https://other.example.org/?login=1',
				$homepage . 'members/?login=1',
			) as $location
		) {
			$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
		}

		foreach ( array( $login, $login . '&reauth=1&redirect_to=%2Fprivate-page%2F' ) as $location ) {
			try {
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Exercise the redirect interface used by auth_redirect().
				wp_redirect( $location );
				$this->fail( 'The custom login redirect must terminate generation.' );
			} catch ( \RuntimeException $error ) {
				$this->assertSame( 403, $error->getCode() );
			}
		}
	}

	public function test_custom_login_redirect_normalizes_absolute_urls() {
		$this->init_request( true );
		$login = '';
		add_filter(
			'login_url',
			function () use ( &$login ) {
				return $login;
			}
		);
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					throw new \RuntimeException( $message, $args['response'] );
				};
			}
		);

		$cases = array(
			array( 'https://example.org?login=1', 'https://example.org?login=1' ),
			array( 'https://example.org?login=1', 'https://example.org/?login=1&reauth=1' ),
			array( 'HTTPS://EXAMPLE.ORG:443?login=1', 'https://example.org/?login=1' ),
			array( 'https://example.org/?login=1', 'HTTPS://EXAMPLE.ORG:443?login=1' ),
			array( 'HTTP://EXAMPLE.ORG:80?login=1', 'http://example.org/?login=1' ),
			array( 'http://example.org/?login=1', 'HTTP://EXAMPLE.ORG:80?login=1' ),
			array( 'https://example.org/members/?login=1', 'https://example.org/members?login=1' ),
			array( 'https://example.org/members?login=1', 'https://example.org/members/?login=1' ),
		);
		foreach ( $cases as list( $login, $location ) ) {
			$this->assertSame( 'https://example.org/', apply_filters( 'wp_redirect', 'https://example.org/', 302 ) );
			$other_port = preg_replace( '/example\.org(?::\d+)?/i', 'example.org:8443', $location );
			$this->assertSame( $other_port, apply_filters( 'wp_redirect', $other_port, 302 ) );

			try {
				// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Exercise the redirect interface used by auth_redirect().
				wp_redirect( $location );
				$this->fail( 'The normalized custom login redirect must terminate generation.' );
			} catch ( \RuntimeException $error ) {
				$this->assertSame( 403, $error->getCode() );
			}
		}
	}

	/**
	 * Redirects that do not target the login page are left untouched.
	 *
	 * @dataProvider provide_non_login_redirects
	 *
	 * @param string $location Redirect location.
	 */
	#[DataProvider( 'provide_non_login_redirects' )]
	public function test_generation_request_other_redirects_unchanged( $location ) {
		$this->init_request( true );
		$location = str_replace( '{home}', untrailingslashit( home_url() ), $location );

		$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
	}

	/**
	 * Data provider for test_generation_request_other_redirects_unchanged.
	 *
	 * @return array[]
	 */
	public static function provide_non_login_redirects() {
		return array(
			'trailing slash'        => array( '{home}/sample-page/' ),
			'same-site reauth arg'  => array( '{home}/members/?reauth=1' ),
			'relative reauth arg'   => array( '/members/?reauth=1' ),
			'other host login page' => array( 'https://login.example.org/wp-login.php?reauth=1' ),
		);
	}

	/**
	 * Ordinary front-end requests keep the login redirect exactly as issued.
	 */
	public function test_non_generation_request_login_redirect_unchanged() {
		$this->init_request( false );
		$location = wp_login_url( home_url( '/private-page/' ), true );

		$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
	}
}
