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
	 * The REQUEST_URI the test suite runs with.
	 *
	 * @var string|null
	 */
	private $request_uri;

	/**
	 * Set up test environment.
	 */
	public function set_up() {
		parent::set_up();
		$this->request_uri = $_SERVER['REQUEST_URI'] ?? null;
	}

	/**
	 * Tear down test environment.
	 */
	public function tear_down() {
		unset( $_GET[ Generator::GENERATE_QUERY_ACTION ] );
		unset( $_SERVER['REQUEST_URI'] );
		remove_all_filters( 'rest_url_prefix' );
		remove_all_filters( 'home_url' );
		unset( $_GET['rest_route'] );
		unset( $_POST['rest_route'] );
		if ( null === $this->request_uri ) {
			unset( $_SERVER['REQUEST_URI'] );
		} else {
			$_SERVER['REQUEST_URI'] = $this->request_uri;
		}
		unset( $GLOBALS['current_screen'] );
		$GLOBALS['pagenow'] = 'index.php';
		remove_all_filters( 'wp_doing_ajax' );
		remove_all_filters( 'wp_doing_cron' );
		remove_all_filters( 'wp_redirect' );
		remove_all_filters( 'wp_redirect_status' );
		remove_all_filters( 'wp_die_handler' );
		remove_all_filters( 'login_url' );
		remove_all_filters( 'option_siteurl' );
		remove_all_filters( 'option_home' );
		remove_all_actions( 'wp_head' );
		remove_all_filters( 'show_admin_bar' );
		parent::tear_down();
	}

	/**
	 * Make wp_die() throw, so a blocked redirect can be asserted instead of ending the process.
	 */
	private function make_wp_die_throw() {
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					throw new \RuntimeException( $message, $args['response'] );
				};
			}
		);
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
				'https://other.example.org/?login=1',
				$homepage . 'members/?login=1',
			) as $location
		) {
			$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
		}

		foreach (
			array(
				$login,
				$login . '&reauth=1&redirect_to=%2Fprivate-page%2F',
				// A site behind a TLS-terminating proxy can redirect to either scheme.
				set_url_scheme( $login, 'http' ),
			) as $location
		) {
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
	 * Every non-canonical shape of the login redirect terminates generation too.
	 *
	 * @dataProvider provide_non_canonical_login_redirects
	 *
	 * @param string $location Redirect location.
	 */
	#[DataProvider( 'provide_non_canonical_login_redirects' )]
	public function test_non_canonical_login_redirects_terminate( $location ) {
		$this->init_request( true );
		$location = str_replace( '{host}', wp_parse_url( home_url(), PHP_URL_HOST ), $location );
		add_filter(
			'wp_die_handler',
			function () {
				/** @return never */
				return function ( $message, $title, $args ) {
					throw new \RuntimeException( $message, $args['response'] );
				};
			}
		);

		try {
			// phpcs:ignore WordPress.Security.SafeRedirect.wp_redirect_wp_redirect -- Exercise the redirect interface used by auth_redirect().
			wp_redirect( $location );
			$this->fail( 'A login redirect must terminate generation whatever shape it arrives in.' );
		} catch ( \RuntimeException $error ) {
			$this->assertSame( 403, $error->getCode() );
		}
	}

	/**
	 * Data provider for test_non_canonical_login_redirects_terminate.
	 *
	 * @return array[]
	 */
	public static function provide_non_canonical_login_redirects() {
		return array(
			'bare relative'   => array( 'wp-login.php?reauth=1' ),
			'scheme flipped'  => array( 'https://{host}/wp-login.php?reauth=1' ),
			'uppercase path'  => array( '/WP-LOGIN.PHP?reauth=1' ),
			'double slash'    => array( '//wp-login.php?reauth=1' ),
			'percent encoded' => array( '%2Fwp-login.php?reauth=1' ),
			'path traversal'  => array( '/members/../wp-login.php?reauth=1' ),
		);
	}

	/**
	 * Generation mode only engages while a front-end page is rendered.
	 *
	 * @dataProvider provide_non_front_end_contexts
	 *
	 * @param callable $enter_context Puts the request into the context under test.
	 */
	#[DataProvider( 'provide_non_front_end_contexts' )]
	public function test_generation_mode_is_front_end_only( $enter_context ) {
		$admin = wp_insert_user(
			array(
				'user_login' => 'generator_admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin );
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';
		$this->assertTrue( Generator::is_generating_critical_css() );

		$enter_context();

		$this->assertFalse( Generator::is_generating_critical_css() );

		Generator::init();
		$this->assertSame( $admin, get_current_user_id() );
		$this->assertFalse( has_filter( 'wp_redirect' ) );
	}

	/**
	 * Data provider for test_generation_mode_is_front_end_only.
	 *
	 * @return array[]
	 */
	public static function provide_non_front_end_contexts() {
		return array(
			'wp-admin'     => array(
				function () {
					set_current_screen( 'dashboard' );
				},
			),
			'wp-login.php' => array(
				function () {
					$GLOBALS['pagenow'] = 'wp-login.php';
				},
			),
			'admin-ajax'   => array(
				function () {
					add_filter( 'wp_doing_ajax', '__return_true' );
				},
			),
			'cron'         => array(
				function () {
					add_filter( 'wp_doing_cron', '__return_true' );
				},
			),
			'rest route'   => array(
				function () {
					$_SERVER['REQUEST_URI'] = self::rest_request_uri( '' );
				},
			),
			'rest query'   => array(
				function () {
					$_GET['rest_route'] = '/jetpack-boost-ds/critical-css-state';
				},
			),
			// WordPress in its own directory: REST URLs follow home, not siteurl.
			'rest own dir' => array(
				function () {
					add_filter(
						'option_siteurl',
						function () {
							return 'http://example.org/wp';
						}
					);
					add_filter(
						'option_home',
						function () {
							return 'http://example.org';
						}
					);
					$_SERVER['REQUEST_URI'] = self::rest_request_uri( '' );
				},
			),
			'rest index'   => array(
				function () {
					$_SERVER['REQUEST_URI'] = self::rest_request_uri( '/index.php' );
				},
			),
			// Resolving this away would hand the request back to generation, so the unresolved form counts too.
			'rest dot out' => array(
				function () {
					$_SERVER['REQUEST_URI'] = '/' . rest_get_url_prefix() . '/../sample-page/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000';
				},
			),
		);
	}

	/**
	 * Build the REST request a dashboard poll makes while carrying the generation parameter.
	 *
	 * @param string $index Leading index.php segment, as index permalinks produce.
	 * @return string
	 */
	private static function rest_request_uri( $index ) {
		return $index . '/' . rest_get_url_prefix() . '/jetpack-boost-ds/critical-css-state?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000';
	}

	/**
	 * A REST request never enters generation mode, whatever shape its path arrives in.
	 *
	 * @dataProvider provide_rest_request_paths
	 *
	 * @param string $request_uri Request URI of the REST call.
	 */
	#[DataProvider( 'provide_rest_request_paths' )]
	public function test_rest_requests_are_not_generation_requests( $request_uri ) {
		$_SERVER['REQUEST_URI']                   = $request_uri;
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertFalse( Generator::is_generating_critical_css() );
	}

	/**
	 * Data provider for test_rest_requests_are_not_generation_requests.
	 *
	 * @return array[]
	 */
	public static function provide_rest_request_paths() {
		return array(
			'plain'           => array( '/wp-json/jetpack-boost-ds/critical-css-state' ),
			'double slash'    => array( '//wp-json/jetpack-boost-ds/critical-css-state' ),
			'triple slash'    => array( '///wp-json/jetpack-boost-ds/critical-css-state' ),
			'dot segment'     => array( '/./wp-json/jetpack-boost-ds/critical-css-state' ),
			'traversal'       => array( '/a/../wp-json/jetpack-boost-ds/critical-css-state' ),
			'percent encoded' => array( '/%2Fwp-json/jetpack-boost-ds/critical-css-state' ),
			'uppercase'       => array( '/WP-JSON/jetpack-boost-ds/critical-css-state' ),
		);
	}

	/**
	 * A subdirectory install whose home URL ends in a slash still has its REST requests recognized.
	 */
	public function test_rest_request_in_subdirectory_install_is_not_a_generation_request() {
		// A home URL ending in a slash makes core emit "/blog//wp-json".
		add_filter(
			'home_url',
			function ( $url, $path ) {
				return 'http://example.org/blog/' . ( $path ? '/' . ltrim( $path, '/' ) : '' );
			},
			10,
			2
		);
		$_SERVER['REQUEST_URI']                   = '/blog/wp-json/jetpack-boost-ds/critical-css-state';
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertFalse( Generator::is_generating_critical_css() );
	}

	/**
	 * An empty REST prefix must not classify ordinary front-end pages as REST requests.
	 */
	public function test_empty_rest_prefix_keeps_front_end_pages_generating() {
		add_filter( 'rest_url_prefix', '__return_empty_string' );
		$_SERVER['REQUEST_URI']                   = '/sample-page/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000';
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertTrue( Generator::is_generating_critical_css() );
	}

	/**
	 * A login URL filtered to a path-less value must not block every root-bound redirect.
	 */
	public function test_degenerate_login_url_does_not_block_redirects() {
		add_filter(
			'login_url',
			function () {
				return 'https://example.org';
			}
		);
		$this->make_wp_die_throw();
		$this->init_request( true );

		foreach ( array( 'https://example.org/', 'https://example.org/sample-page/' ) as $location ) {
			$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
		}
	}

	/**
	 * Ordinary front-end requests keep the login redirect exactly as issued.
	 */
	public function test_non_generation_request_login_redirect_unchanged() {
		$this->init_request( false );
		$location = wp_login_url( home_url( '/private-page/' ), true );

		$this->assertSame( $location, apply_filters( 'wp_redirect', $location, 302 ) );
	}

	/**
	 * A root install whose home URL ends in a slash still recognizes an index-permalink REST request.
	 */
	public function test_rest_index_request_with_trailing_slash_home_is_not_a_generation_request() {
		add_filter(
			'option_home',
			function () {
				return 'http://example.org/';
			}
		);
		$_SERVER['REQUEST_URI']                   = self::rest_request_uri( '/index.php' );
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertFalse( Generator::is_generating_critical_css() );
	}

	/**
	 * A REST prefix of more than one segment is matched whole, so pages under its tail still generate.
	 */
	public function test_multi_segment_rest_prefix_does_not_capture_unrelated_pages() {
		add_filter(
			'rest_url_prefix',
			function () {
				return 'api/v2';
			}
		);
		add_filter(
			'option_home',
			function () {
				return 'http://example.org/';
			}
		);
		$_SERVER['REQUEST_URI']                   = '/v2/sample-page/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000';
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertTrue( Generator::is_generating_critical_css() );
	}

	/**
	 * WP::parse_request() reads rest_route from the body before the query, so a POST carrying it is REST.
	 */
	public function test_rest_route_in_post_body_is_not_a_generation_request() {
		$_POST['rest_route']                      = '/jetpack-boost-ds/critical-css-state';
		$_GET[ Generator::GENERATE_QUERY_ACTION ] = '1700000000000';

		$this->assertFalse( Generator::is_generating_critical_css() );
	}

	/**
	 * A relative redirect resolves against the request path, even when REQUEST_URI has a doubled slash.
	 */
	public function test_relative_login_redirect_resolves_against_a_doubled_slash_request_uri() {
		add_filter(
			'login_url',
			function () {
				return 'http://example.org/members/area/wp-login.php';
			}
		);
		$_SERVER['REQUEST_URI'] = '//members/area/?' . Generator::GENERATE_QUERY_ACTION . '=1700000000000';
		$this->make_wp_die_throw();
		$this->init_request( true );

		$this->expectException( \RuntimeException::class );
		apply_filters( 'wp_redirect', 'wp-login.php', 302 );
	}
}
