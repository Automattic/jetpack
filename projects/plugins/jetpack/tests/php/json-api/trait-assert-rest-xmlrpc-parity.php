<?php
/**
 * Reusable assertion: a JSON API endpoint's REST dispatch produces the same
 * response body as its XML-RPC dispatch, for the same logical request.
 *
 * Both paths run on the Jetpack site and both end in the same `callback()`, then apply
 * filter_fields() before returning:
 *
 *   XML-RPC: WPCOM_JSON_API::serve()  -> adds user_can_richedit + comment_edit_pre,
 *                                        sets $api->endpoint/path/version
 *                                     -> process_request() -> callback() -> output()/filter_fields()
 *   REST:    WPCOM_JSON_API_Endpoint::rest_callback() -> the SAME setup -> callback() -> filter_fields()
 *
 * So the ways the two can diverge are (1) the edit-context filter set drifting out of sync
 * (the jetpack#42377 regression class), (2) the REST route failing to pass through a request
 * param the XML-RPC query carried, and (3) the REST path skipping the field filtering that
 * output() applies on XML-RPC. This assertion drives both paths over shared fixtures (including
 * a `fields=` request) and compares the decoded bodies, catching exactly that.
 *
 * Self-contained: it creates its own admin user, aligns the Jetpack blog id, and mocks
 * the request signature internally. A consuming WP_UnitTestCase only needs to call
 * tear_down_rest_parity() from its tear_down().
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Rest_Authentication as Connection_Rest_Authentication;

/**
 * Asserts REST-vs-XML-RPC body parity for a JSON API endpoint.
 *
 * Intended to be used only by WP_UnitTestCase subclasses; it relies on their assert*()
 * and factory() methods. The mixin annotation below resolves the instance assertions for
 * static analysis; the static factory() is declared explicitly (a trait can't resolve a
 * self:: call against the mixin).
 *
 * @mixin \WP_UnitTestCase
 * @method static \WP_UnitTest_Factory factory()
 */
trait Assert_Rest_Xmlrpc_Parity {

	/**
	 * Blog id both dispatch paths resolve to.
	 *
	 * @var int
	 */
	private $rest_parity_blog_id;

	/**
	 * Admin user the parity request authenticates as.
	 *
	 * @var int
	 */
	private $rest_parity_user_id;

	/**
	 * Saved $_SERVER values to restore in tear_down.
	 *
	 * @var array
	 */
	private $rest_parity_server = array();

	/**
	 * Current user id before the parity env switched it, restored in tear_down.
	 *
	 * @var int
	 */
	private $rest_parity_prior_user_id;

	/**
	 * API singleton token_details before the parity env overwrote them, restored in tear_down.
	 *
	 * @var array
	 */
	private $rest_parity_prior_token_details;

	/**
	 * Jetpack blog id option before the parity env aligned it, restored in tear_down.
	 *
	 * @var mixed
	 */
	private $rest_parity_prior_blog_option;

	/**
	 * Assert that the REST dispatch of $endpoint matches its XML-RPC dispatch.
	 *
	 * @param WPCOM_JSON_API_Endpoint $endpoint   The endpoint under test.
	 * @param array                   $query      Request params (number, context, type, ...).
	 * @param array                   $url_params Route placeholder values beyond the site, as an
	 *                                            associative map of REST param name => value, in path
	 *                                            order (e.g. array( 'post_id' => 5 )). Must be string
	 *                                            keyed: rest_callback() merges these as
	 *                                            array( $path, $blog_id ) + get_url_params(), so
	 *                                            numeric keys (0, 1) would collide with $path/$blog_id
	 *                                            and the value would be dropped on the REST side.
	 * @param string|null             $api_path   Concrete API path; defaults to the endpoint path
	 *                                            with the blog id and $url_params substituted.
	 * @return array{0: mixed, 1: mixed} [ xmlrpc_body, rest_body ] for further assertions.
	 */
	protected function assert_rest_parity( WPCOM_JSON_API_Endpoint $endpoint, array $query = array(), array $url_params = array(), $api_path = null ) {
		$this->prepare_rest_parity_env();

		if ( null === $api_path ) {
			// The site is always the first placeholder; remaining placeholders (post id, slug) are
			// filled from $url_params values in path order, so multi-placeholder paths resolve too.
			$api_path = false === strpos( (string) $endpoint->path, '%' )
				? $endpoint->path
				: vsprintf( $endpoint->path, array_merge( array( $this->rest_parity_blog_id ), array_values( $url_params ) ) );
		}

		// The endpoint is actually REST-enabled and its route resolves.
		$this->assertNotEmpty( $endpoint->rest_route, 'Endpoint declares a rest_route.' );
		$this->assertStringContainsString(
			ltrim( $endpoint->rest_route, '/' ),
			$endpoint->build_rest_route(),
			'build_rest_route() includes the declared rest_route.'
		);

		$xmlrpc = $this->dispatch_xmlrpc_body( $endpoint, $api_path, $query, $url_params );
		$rest   = $this->dispatch_rest_body( $endpoint, $query, $url_params );

		$this->assertEquals(
			$xmlrpc,
			$rest,
			'REST response body diverged from the XML-RPC body for ' . $api_path
		);

		return array( $xmlrpc, $rest );
	}

	/**
	 * Remove the filters/superglobals the parity helpers install. Call from tear_down().
	 */
	protected function tear_down_rest_parity() {
		remove_all_filters( 'pre_option_jetpack_private_options' );
		remove_filter( 'user_can_richedit', '__return_true' );
		remove_filter( 'comment_edit_pre', array( WPCOM_JSON_API::init(), 'comment_edit_pre' ) );

		unset( $_GET['token'], $_GET['timestamp'], $_GET['nonce'], $_GET['body-hash'], $_GET['signature'] );

		foreach ( $this->rest_parity_server as $key => $value ) {
			if ( null === $value ) {
				unset( $_SERVER[ $key ] );
			} else {
				$_SERVER[ $key ] = $value;
			}
		}
		$this->rest_parity_server = array();

		if ( class_exists( Connection_Rest_Authentication::class ) ) {
			Connection_Rest_Authentication::init()->reset_saved_auth_state();
		}

		WPCOM_JSON_API::init()->query = array();

		// Restore the global/singleton state prepare_rest_parity_env() switched, so a consumer
		// whose tear_down() only calls this helper (e.g. the coverage sweep) does not leak it.
		if ( isset( $this->rest_parity_blog_id ) ) {
			wp_set_current_user( (int) $this->rest_parity_prior_user_id );
			WPCOM_JSON_API::init()->token_details = $this->rest_parity_prior_token_details;

			if ( empty( $this->rest_parity_prior_blog_option ) ) {
				Jetpack_Options::delete_option( 'id' );
			} else {
				Jetpack_Options::update_option( 'id', $this->rest_parity_prior_blog_option );
			}
		}
	}

	/**
	 * Lazily set up the shared fixtures: an admin user, the blog id alignment, and the
	 * baseline request environment. Idempotent within a single test.
	 */
	private function prepare_rest_parity_env() {
		if ( isset( $this->rest_parity_blog_id ) ) {
			return;
		}

		// Capture the global/singleton state we are about to mutate so tear_down can restore it;
		// the DB transaction rollback covers option rows, but not the API singleton or current user.
		$this->rest_parity_prior_user_id       = get_current_user_id();
		$this->rest_parity_prior_token_details = WPCOM_JSON_API::init()->token_details;
		$this->rest_parity_prior_blog_option   = Jetpack_Options::get_option( 'id' );

		$this->rest_parity_blog_id = (int) $GLOBALS['blog_id'];
		$this->rest_parity_user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $this->rest_parity_user_id );

		// rest_callback() derives the blog id from Jetpack_Options::get_option( 'id' );
		// align it with the test blog so both dispatch paths resolve the same site.
		Jetpack_Options::update_option( 'id', $this->rest_parity_blog_id );

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $this->rest_parity_blog_id );

		foreach ( array( 'HTTP_HOST', 'REQUEST_URI', 'REQUEST_METHOD' ) as $key ) {
			$this->rest_parity_server[ $key ] = $_SERVER[ $key ] ?? null;
		}
	}

	/**
	 * Run the endpoint the XML-RPC way: reproduce serve()'s request context + edit-context
	 * filters, set the shared query, and invoke callback() directly.
	 *
	 * @param WPCOM_JSON_API_Endpoint $endpoint   Endpoint.
	 * @param string                  $api_path   Concrete API path.
	 * @param array                   $query      Request params.
	 * @param array                   $url_params Route placeholder values.
	 * @return mixed Decoded body.
	 */
	private function dispatch_xmlrpc_body( WPCOM_JSON_API_Endpoint $endpoint, $api_path, array $query, array $url_params ) {
		$api        = WPCOM_JSON_API::init();
		$api->query = $query;

		// Mirror the request context both serve() and rest_callback() establish before
		// dispatch, so version-dependent output (e.g. link URLs) matches. rest_callback()
		// sets these at class.json-api-endpoints.php:2753-2756.
		$api->endpoint = $endpoint;
		$api->path     = $endpoint->path;
		$api->version  = $endpoint->max_version;

		// Mirror WPCOM_JSON_API::serve() (class.json-api.php:413-415).
		add_filter( 'user_can_richedit', '__return_true' );
		add_filter( 'comment_edit_pre', array( $api, 'comment_edit_pre' ) );

		$args     = array_merge( array( $api_path, $this->rest_parity_blog_id ), array_values( $url_params ) );
		$response = call_user_func_array( array( $endpoint, 'callback' ), $args );

		remove_filter( 'user_can_richedit', '__return_true' );
		remove_filter( 'comment_edit_pre', array( $api, 'comment_edit_pre' ) );

		// Mirror WPCOM_JSON_API::output(), which the real serve() path runs after callback():
		// it applies filter_fields() so a `fields=` request returns only the requested keys.
		if ( ! is_wp_error( $response ) ) {
			$response = $api->filter_fields( $response );
		}

		return $this->normalize_body( $response );
	}

	/**
	 * Run the endpoint through the real rest_callback() and return its decoded body.
	 *
	 * Query params reach callback() the same way they do in production: via the shared
	 * WPCOM_JSON_API singleton's ->query, which the real request populates by parsing the
	 * request URL (class.json-api.php). rest_callback() itself only pulls the route placeholders
	 * (get_url_params()) plus `language`/`http_envelope` off the WP_REST_Request, so we set the
	 * query on the singleton and also mirror it onto the request to cover those request-read keys.
	 * Both transports therefore read the identical ->query — this asserts callback()/rest_callback()
	 * parity, not the URL-to-query parsing, which is shared and not REST-specific.
	 *
	 * @param WPCOM_JSON_API_Endpoint $endpoint   Endpoint.
	 * @param array                   $query      Request params.
	 * @param array                   $url_params Route placeholder values.
	 * @return mixed Decoded body.
	 */
	private function dispatch_rest_body( WPCOM_JSON_API_Endpoint $endpoint, array $query, array $url_params ) {
		WPCOM_JSON_API::init()->query = $query;

		$this->set_up_rest_authentication();

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/' . ltrim( $endpoint->build_rest_route(), '/' ) );
		$request->set_url_params( $url_params );
		foreach ( $query as $key => $value ) {
			$request->set_param( $key, $value );
		}

		$response = $endpoint->rest_callback( $request );

		$this->assertIsArray( $response, 'rest_callback() returns [ json, nonce, hmac ].' );
		$this->assertCount( 3, $response, 'rest_callback() returns [ json, nonce, hmac ].' );

		return json_decode( $response[0], true );
	}

	/**
	 * Normalize a callback() return into the same decoded shape rest_callback() emits
	 * (WP_Error -> serializable error, then a JSON round-trip so objects become arrays).
	 *
	 * @param mixed $response Raw callback() return.
	 * @return mixed Decoded body.
	 */
	private function normalize_body( $response ) {
		if ( is_wp_error( $response ) ) {
			$response = WPCOM_JSON_API::serializable_error( $response );
		}
		return json_decode( wp_json_encode( $response, JSON_UNESCAPED_SLASHES ), true );
	}

	/**
	 * Mock the signature/token environment so rest_callback() passes verification.
	 * Mirrors WPCOM_JSON_API_Endpoint_Rest_Callback_Test::set_up_authentication().
	 */
	private function set_up_rest_authentication() {
		if ( class_exists( Connection_Rest_Authentication::class ) ) {
			Connection_Rest_Authentication::init()->reset_saved_auth_state();
		}

		// dispatch_rest_body() calls this once per assert_rest_parity(); remove before adding so a
		// multi-endpoint test (the coverage sweep) keeps exactly one copy of the callback.
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ), 10, 2 );

		// Signature verification rebuilds the HMAC from these superglobals, not the WP_REST_Request
		// route, so this fixed request line only has to match the signature computed below.
		$_SERVER['HTTP_HOST']      = 'example.org';
		$_SERVER['REQUEST_URI']    = '/jetpack/v4/test?qstest=yep';
		$_SERVER['REQUEST_METHOD'] = 'GET';

		$_GET['token']     = 'pretend_this_is_valid:1:' . $this->rest_parity_user_id;
		$_GET['timestamp'] = (string) time();
		$_GET['nonce']     = 'testing123';

		$_GET['signature'] = base64_encode(
			hash_hmac(
				'sha1',
				implode(
					"\n",
					array(
						$_GET['token'],
						$_GET['timestamp'],
						$_GET['nonce'],
						'',
						'GET',
						'example.org',
						'80',
						'/jetpack/v4/test',
						'qstest=yep',
					)
				) . "\n",
				'secret',
				true
			)
		);
	}

	/**
	 * Provide test tokens via the jetpack_private_options option.
	 *
	 * @param mixed  $value       Original option value (unused).
	 * @param string $option_name Option name (unused).
	 * @return array
	 */
	public function mock_jetpack_private_options( $value, $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return array(
			'user_tokens' => array(
				$this->rest_parity_user_id => 'pretend_this_is_valid.secret.' . $this->rest_parity_user_id,
			),
			'blog_token'  => 'pretend_this_is_valid_blog_token.secret_blog',
		);
	}
}
