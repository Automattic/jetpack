<?php
/**
 * Testing of the `Client` methods that build and make outgoing signed requests.
 *
 * Note the file name: this class must not sort ahead of the first test class in the suite.
 * Several classes (ManagerIntegrationTest, ManagerTest, Jetpack_XMLRPC_Server_Test) depend on
 * being preceded by a class that leaves `Manager`'s memoized connection status invalidatable,
 * and displacing the first class breaks them.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Connection\Traits\WPCOM_REST_API_Proxy_Request;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Identity_Crisis;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Testing of the `Client` methods that build and make outgoing signed requests.
 */
class Remote_Request_Test extends BaseTestCase {

	/**
	 * Error_Handler instance.
	 *
	 * @var Error_Handler
	 */
	private $error_handler;

	/**
	 * URL of the last request `capture_sent_url()` intercepted.
	 *
	 * @var string|null
	 */
	private $sent_url;

	/**
	 * Initialize tests.
	 */
	public function set_up() {
		$this->error_handler = Error_Handler::get_instance();

		// Signing failures are only reported on registered sites.
		\Jetpack_Options::update_option( 'id', 12345 );

		// The reporting gate is per error code and lives for an hour; tests assert on the
		// stored result, not on the gate.
		add_filter( 'jetpack_connection_bypass_error_reporting_gate', '__return_true' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_connection_bypass_error_reporting_gate' );
		remove_all_filters( 'pre_http_request' );
		remove_all_filters( 'jetpack_remote_request_url' );
		ini_restore( 'arg_separator.output' );

		// `Client::build_signed_request()` registers this filter on every call and never
		// removes it; left in place it changes how constants resolve for later tests.
		remove_all_filters( 'jetpack_constant_default_value' );
		Constants::clear_constants();
		\Jetpack_Options::delete_option( 'id' );

		$this->error_handler->delete_all_errors();

		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'user_tokens' );
		Jetpack_Options::delete_option( 'master_user' );

		// `Manager::is_connected()` memoizes its result and hook registration.
		// Reset both so later tests can re-register the hooks and invalidate the cache.
		$manager_reflection = new \ReflectionClass( Manager::class );
		foreach ( array(
			'is_connected'                  => null,
			'connection_invalidators_added' => false,
		) as $name => $value ) {
			$static = $manager_reflection->getProperty( $name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$static->setAccessible( true );
			}
			$static->setValue( null, $value );
		}

		// The displayable errors are cached per viewer on the singleton.
		$reflection = new \ReflectionClass( $this->error_handler );
		$property   = $reflection->getProperty( 'cached_displayable_errors' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $this->error_handler, null );
	}

	/**
	 * Test that a request that cannot be signed reports why, rather than a generic code.
	 *
	 * `Tokens::get_access_token()` distinguishes eight reasons a token cannot be loaded, and
	 * `build_signed_request()` asks for them instead of collapsing them into a generic code.
	 */
	public function test_build_signed_request_returns_the_specific_token_error() {
		$result = Client::build_signed_request( array( 'url' => 'https://example.org/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_possible_tokens', $result->get_error_code() );
	}

	/**
	 * Test the same for a user token, which fails on a different branch.
	 */
	public function test_build_signed_request_returns_the_specific_user_token_error() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123' );

		$result = Client::build_signed_request(
			array(
				'url'     => 'https://example.org/',
				'user_id' => 12,
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_user_tokens', $result->get_error_code() );
	}

	/**
	 * Test that a signing failure is reported to the Error_Handler.
	 *
	 * The request is never sent, so it has no response for `check_api_response_for_errors()`
	 * to inspect; `remote_request()` reports the signing failure itself.
	 */
	public function test_remote_request_reports_a_signing_failure() {
		$result = Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $stored_errors );

		// No token was found, so there's nothing to attribute the error to a specific user
		// with; it falls back to the request's $user_id (defaulted to 0, i.e. site-level).
		$stored = $stored_errors['no_possible_tokens']['0'];

		$this->assertSame( Error_Handler::ERROR_TYPE_REST, $stored['error_type'] );
		$this->assertSame( Error_Handler::DIRECTION_OUTGOING, $stored['error_direction'] );
		$this->assertSame( 'https://example.org/wp-json/', $stored['error_data']['url'] );
	}

	/**
	 * Test that a signing failure for the connection owner (`user_id => true`) is attributed
	 * to the resolved master user, not the site.
	 *
	 * `Client` no longer resolves the `true` sentinel itself — `Tokens::get_access_token()`
	 * does, and attaches the resolved id to the `WP_Error` it raises, which
	 * `check_signed_request_for_errors()` reads back out.
	 */
	public function test_remote_request_attributes_a_signing_failure_to_the_connection_owner() {
		Jetpack_Options::update_option( 'master_user', 12 );

		$result = Client::remote_request(
			array(
				'url'     => 'https://example.org/wp-json/',
				'user_id' => true,
			)
		);

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_user_tokens', $result->get_error_code() );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( '12', $stored_errors['no_user_tokens'] );
		$this->assertArrayNotHasKey( '0', $stored_errors['no_user_tokens'] );
	}

	/**
	 * Test that a token lock is deliberately not reported: it is a one-shot transitional
	 * state, since `Tokens::get_access_token()` wipes all tokens (and the lock itself) the
	 * moment it trips. The very next signing attempt therefore takes the normal path and
	 * fails with the already-reported `no_possible_tokens` instead.
	 */
	public function test_tokens_locked_is_not_reported_but_self_heals() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123' );
		// A lock whose site URL doesn't match this site's is treated as active regardless of
		// expiry (Tokens::is_locked()).
		Jetpack_Options::update_option(
			'token_lock',
			gmdate( 'Y-m-d\TH:i:sP' ) . '|||' . base64_encode( 'https://not-this-site.example' )
		);

		$result = Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'tokens_locked', $result->get_error_code() );
		$this->assertEmpty( $this->error_handler->get_stored_errors(), 'tokens_locked is not in known_errors, so report_error() should silently discard it' );

		// The lock (and the token it locked) is now gone; the next attempt takes the normal
		// path and fails with the standard, reportable code.
		$result = Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$this->assertInstanceOf( 'WP_Error', $result );
		$this->assertSame( 'no_possible_tokens', $result->get_error_code() );
		$this->assertArrayHasKey( 'no_possible_tokens', $this->error_handler->get_stored_errors() );
	}

	/**
	 * Test that an outgoing XML-RPC request is reported as such.
	 */
	public function test_remote_request_reports_a_signing_failure_as_xmlrpc() {
		$result = Client::remote_request( array( 'url' => 'https://jetpack.wordpress.com/xmlrpc.php' ) );

		$this->assertInstanceOf( 'WP_Error', $result );

		$stored_errors = $this->error_handler->get_stored_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $stored_errors );
		$this->assertSame( Error_Handler::ERROR_TYPE_XMLRPC, $stored_errors['no_possible_tokens']['0']['error_type'] );
	}

	/**
	 * Test that reporting a signing failure surfaces a notice.
	 *
	 * `no_possible_tokens` is on the displayable list, and a request with no explicit
	 * `user_id` is attributed to the site (user ID 0), so it is not skipped by the
	 * 'invalid'-attribution guard in the display pipeline.
	 */
	public function test_a_reported_signing_failure_is_displayed() {
		Client::remote_request( array( 'url' => 'https://example.org/wp-json/' ) );

		$displayable = $this->error_handler->get_displayable_errors();

		$this->assertArrayHasKey( 'no_possible_tokens', $displayable );
		$this->assertSame( 'site', $displayable['no_possible_tokens']['0']['audience'] );
	}

	/**
	 * Test that signing refuses a URL whose path the transport or WordPress.com would resolve to another resource.
	 *
	 * @dataProvider provide_url_paths
	 *
	 * @param string $url      The request URL.
	 * @param bool   $rejected Whether signing must refuse the URL.
	 */
	#[DataProvider( 'provide_url_paths' )]
	public function test_build_signed_request_refuses_a_path_that_names_another_resource( $url, $rejected ) {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123' );

		$result = Client::build_signed_request( array( 'url' => $url ) );

		if ( $rejected ) {
			$this->assertInstanceOf( 'WP_Error', $result );
			$this->assertSame( 'invalid_request_path', $result->get_error_code() );
		} else {
			$this->assertIsArray( $result );
		}
	}

	/**
	 * URLs, and whether signing must refuse them.
	 *
	 * @return array
	 */
	public static function provide_url_paths() {
		$base = 'https://public-api.wordpress.com/wpcom/v2/sites/1';

		return array(
			'parent segment'         => array( "$base/x/../../sites/2/posts", true ),
			'encoded parent segment' => array( "$base/x/%2e%2e/%2E%2e/sites/2/posts", true ),
			'encoded slash'          => array( "$base/x/..%2f..%2fsites/2/posts", true ),
			'current segment'        => array( "$base/./posts", true ),
			'fragment'               => array( "$base/posts#x", true ),
			'whitespace'             => array( "$base/po sts", true ),
			'control character'      => array( "$base/posts\x00", true ),
			'dots inside a segment'  => array( 'https://public-api.wordpress.com/rest/v1.1/sites/1/a.b', false ),
			'dot segment in query'   => array( "$base/posts?path=../x", false ),
			'encoded space'          => array( "$base/a%20b", false ),
		);
	}

	/**
	 * Test that the proxy refuses a path that would make the outgoing URL name another resource.
	 *
	 * @dataProvider provide_proxy_paths
	 *
	 * @param string      $path          Path passed to the proxy, as a route capture holds it.
	 * @param string|null $expected_path Path the outgoing URL must end with, or null when the proxy must refuse it.
	 */
	#[DataProvider( 'provide_proxy_paths' )]
	public function test_proxy_request_refuses_a_path_that_names_another_resource( $path, $expected_path ) {
		$this->capture_sent_url();

		$result = $this->make_proxy()->proxy_request_to_wpcom( new \WP_REST_Request( 'GET', '/wpcom/v2/email-preview' ), $path, 'blog' );

		if ( null === $expected_path ) {
			$this->assertInstanceOf( 'WP_Error', $result );
			$this->assertSame( 'rest_invalid_param', $result->get_error_code() );
			$this->assertNull( $this->sent_url );
		} else {
			$this->assertStringEndsWith( $expected_path, (string) wp_parse_url( $this->sent_url, PHP_URL_PATH ) );
		}
	}

	/**
	 * Proxy paths, and the path the outgoing URL must end with.
	 *
	 * @return array
	 */
	public static function provide_proxy_paths() {
		return array(
			'query'                 => array( '1?post_id=8', null ),
			'fragment'              => array( '1#x', null ),
			'percent'               => array( '%2e%2e/sites/2', null ),
			'whitespace'            => array( '1 2', null ),
			'parent segment'        => array( '../../sites/2/posts', null ),
			'current segment'       => array( './1', null ),
			'trailing parent'       => array( '1/..', null ),
			'dots inside a segment' => array( 'v1.1/a.b', '/sites/12345/email-preview/v1.1/a.b' ),
		);
	}

	/**
	 * Test that a proxied request reaches WordPress.com with the query params it was given.
	 *
	 * @dataProvider provide_query_params_with_special_characters
	 *
	 * @param array  $query_params  Decoded query parameters of the incoming request.
	 * @param string $arg_separator The host's `arg_separator.output` setting.
	 */
	#[DataProvider( 'provide_query_params_with_special_characters' )]
	public function test_proxy_request_keeps_query_params_intact( $query_params, $arg_separator = '&' ) {
		ini_set( 'arg_separator.output', $arg_separator ); // phpcs:ignore WordPress.PHP.IniSet.Risky
		// Every connected site rewrites the outgoing URL through this filter before it is signed.
		add_filter( 'jetpack_remote_request_url', array( Identity_Crisis::init(), 'add_idc_query_args_to_url' ) );
		// Any other code on the filter can decode the query again, as `add_query_arg()` does.
		add_filter(
			'jetpack_remote_request_url',
			function ( $url ) {
				return add_query_arg( 'lossy', '1', $url );
			}
		);
		$this->capture_sent_url();

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/email-preview' );
		$request->set_query_params( $query_params );
		$this->make_proxy()->proxy_request_to_wpcom( $request, '', 'user', true );

		$this->assertNotNull( $this->sent_url );
		parse_str( (string) wp_parse_url( $this->sent_url, PHP_URL_QUERY ), $sent_params );
		$this->assertSame( '11', $sent_params['post_id'] );
	}

	/**
	 * Test that a `_method` query param does not reach WordPress.com, where it would replace the HTTP method the proxy sends.
	 */
	public function test_proxy_request_does_not_forward_a_method_override() {
		$this->capture_sent_url();

		$request = new \WP_REST_Request( 'GET', '/wpcom/v2/email-preview' );
		$request->set_query_params(
			array(
				'post_id' => '11',
				'_method' => 'DELETE',
			)
		);
		$this->make_proxy()->proxy_request_to_wpcom( $request, '', 'blog' );

		parse_str( (string) wp_parse_url( (string) $this->sent_url, PHP_URL_QUERY ), $sent_params );
		$this->assertArrayNotHasKey( '_method', $sent_params );
	}

	/**
	 * Test that the proxy forwards a body only when this site parsed it as JSON, since WordPress.com always will.
	 *
	 * @dataProvider provide_body_content_types
	 *
	 * @param string|null $content_type Content type of the incoming request, or null for none.
	 * @param bool        $forwarded    Whether the request must reach WordPress.com.
	 * @param string      $route        Route of the request; empty for a request built in code.
	 */
	#[DataProvider( 'provide_body_content_types' )]
	public function test_proxy_request_forwards_only_a_body_parsed_as_json( $content_type, $forwarded, $route = '/wpcom/v2/publicize/render-messages' ) {
		$this->capture_sent_url();

		$request = new \WP_REST_Request( 'POST', $route );
		$request->set_query_params( array( 'post_id' => '11' ) );
		if ( null !== $content_type ) {
			$request->set_header( 'Content-Type', $content_type );
		}
		$request->set_body( '{"post_id":8}' );
		$result = $this->make_proxy()->proxy_request_to_wpcom( $request, '', 'blog' );

		$this->assertSame( $forwarded, null !== $this->sent_url );
		if ( ! $forwarded ) {
			$this->assertInstanceOf( \WP_Error::class, $result );
			$this->assertSame( 'rest_invalid_content_type', $result->get_error_code() );
		}
	}

	/**
	 * Content types of a request body, and whether the proxy must forward it.
	 *
	 * @return array
	 */
	public static function provide_body_content_types() {
		return array(
			'json'                      => array( 'application/json', true ),
			'json with charset'         => array( 'application/json; charset=utf-8', true ),
			'form'                      => array( 'application/x-www-form-urlencoded', false ),
			'json only in a parameter'  => array( 'text/plain; x=application/json', false ),
			'no content type'           => array( null, false ),
			'built in code, unlabelled' => array( null, true, '' ),
			'built in code, form'       => array( 'application/x-www-form-urlencoded', false, '' ),
		);
	}

	/**
	 * Query parameters, and host settings, that the proxy must forward unchanged.
	 *
	 * @return array
	 */
	public static function provide_query_params_with_special_characters() {
		return array(
			'encoded key'        => array(
				array(
					'post_id'   => '11',
					'%70ost_id' => '8',
				),
			),
			'plus in key'        => array(
				array(
					'post_id' => '11',
					'post+id' => '8',
				),
			),
			'ampersand in value' => array(
				array(
					'post_id' => '11',
					'x'       => '1&post_id=8',
				),
			),
			'entity separator'   => array(
				array(
					'access'  => 'everybody',
					'post_id' => '11',
				),
				'&amp;',
			),
		);
	}

	/**
	 * Connect the site and record the URL of the next outgoing request instead of sending it.
	 */
	private function capture_sent_url() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123' );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		$this->sent_url = null;
		add_filter(
			'pre_http_request',
			function ( $response, $args, $url ) {
				$this->sent_url = $url;
				return array(
					'headers'  => array(),
					'body'     => '{}',
					'response' => array( 'code' => 200 ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Build a controller that proxies `email-preview` with the trait.
	 *
	 * @return object
	 */
	private function make_proxy() {
		return new class() {
			use WPCOM_REST_API_Proxy_Request;

			/**
			 * Set the route the proxy forwards to.
			 */
			public function __construct() {
				$this->base_api_path = 'wpcom';
				$this->version       = '2';
				$this->rest_base     = 'email-preview';
			}
		};
	}
}
