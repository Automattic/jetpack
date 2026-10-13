<?php
/**
 * Tests for WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap.
 * To run this test by itself use the following command:
 * jetpack docker phpunit jetpack -- --filter=WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\CoversClass;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap_Test
 *
 * Runs as WordPress.com Simple, so the local callbacks are registered rather than the proxy. That is
 * where the endpoint's own behaviour lives; off Simple it hands the whole request to the connection
 * package's proxy trait, which has its own tests.
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap::class )]
class WPCOM_REST_API_V2_Endpoint_Email_Editor_Bootstrap_Test extends Jetpack_REST_TestCase {

	/**
	 * Route to the endpoint.
	 *
	 * @var string
	 */
	private static $path = '/wpcom/v2/email-editor-bootstrap';

	/**
	 * A user who may edit theme options.
	 *
	 * @var int
	 */
	private static $user_id_admin = 0;

	/**
	 * A user who may edit posts but not theme options.
	 *
	 * @var int
	 */
	private static $user_id_editor = 0;

	/**
	 * Filters added by a test, removed again on tear down.
	 *
	 * @var array
	 */
	private $added_filters = array();

	/**
	 * Set up. IS_WPCOM must be set before parent::set_up() so `rest_api_init` registers the local
	 * callbacks rather than the proxy.
	 */
	public function set_up() {
		Constants::set_constant( 'IS_WPCOM', true );
		parent::set_up();

		static::$user_id_admin  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		static::$user_id_editor = self::factory()->user->create( array( 'role' => 'editor' ) );

		wp_set_current_user( static::$user_id_admin );
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		foreach ( $this->added_filters as $filter ) {
			remove_filter( $filter[0], $filter[1] );
		}
		$this->added_filters = array();

		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Hook a filter for the duration of one test.
	 *
	 * @param string   $hook     Filter name.
	 * @param callable $callback Callback.
	 */
	private function add_temporary_filter( $hook, $callback ) {
		add_filter( $hook, $callback, 10, 2 );
		$this->added_filters[] = array( $hook, $callback );
	}

	/**
	 * A request to the endpoint.
	 *
	 * @param string $method HTTP method.
	 * @param array  $params Request params.
	 *
	 * @return WP_REST_Request
	 */
	private function request( $method, array $params = array() ) {
		$request = new WP_REST_Request( $method, static::$path );

		foreach ( $params as $key => $value ) {
			$request->set_param( $key, $value );
		}

		return $request;
	}

	/**
	 * Re-register the routes as a site that is not WordPress.com Simple.
	 *
	 * The callbacks are chosen in `register_routes()` from the host, so switching platform means
	 * firing `rest_api_init` again against a fresh server rather than only flipping the constant.
	 */
	private function register_routes_as_non_simple() {
		Constants::set_constant( 'IS_WPCOM', false );

		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init' );
	}

	/**
	 * A design document, in the shape the editor saves.
	 *
	 * @return array
	 */
	private function design() {
		return array( 'styles' => array( 'typography' => array( 'fontSize' => '42px' ) ) );
	}

	/**
	 * Test that the endpoint route is registered.
	 */
	public function test_route_is_registered() {
		$this->assertArrayHasKey( static::$path, $this->server->get_routes() );
	}

	/**
	 * Test that the route accepts a read and a write.
	 */
	public function test_route_accepts_read_and_write_methods() {
		$routes  = $this->server->get_routes();
		$methods = array();

		foreach ( $routes[ static::$path ] as $handler ) {
			$methods = array_merge( $methods, array_keys( $handler['methods'] ) );
		}

		// The editor sends POST and the server has been observed receiving PUT. Both must be accepted.
		$this->assertContains( Requests::GET, $methods );
		$this->assertContains( Requests::POST, $methods );
		$this->assertContains( Requests::PUT, $methods );
	}

	/**
	 * Test that an unauthenticated user cannot read the bundle.
	 */
	public function test_read_rejects_unauthenticated_user() {
		wp_set_current_user( 0 );

		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Test that a user who may edit posts but not theme options cannot read the bundle.
	 *
	 * The capability bar is the point: an editor can write posts, and must still not be able to
	 * change the site's email design.
	 */
	public function test_read_rejects_user_without_edit_theme_options() {
		wp_set_current_user( static::$user_id_editor );

		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Test that the same capability guards the write.
	 */
	public function test_write_rejects_user_without_edit_theme_options() {
		wp_set_current_user( static::$user_id_editor );

		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertErrorResponse( 'rest_forbidden', $response, 403 );
	}

	/**
	 * Test that the read returns whatever the filter provides.
	 */
	public function test_read_returns_the_filtered_bundle() {
		$bundle = array(
			'editor_settings'      => array( 'color' => array() ),
			'editor_theme'         => array( 'version' => 3 ),
			'template'             => array( 'id' => 'pub/theme//wpcom-new-post' ),
			'personalization_tags' => array(),
			'blog_id'              => 1234,
			'design'               => $this->design(),
		);

		$this->add_temporary_filter(
			'jetpack_email_editor_bootstrap',
			static function () use ( $bundle ) {
				return $bundle;
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $bundle, $response->get_data() );
	}

	/**
	 * Test that the read hands the request to the filter, so an implementation can resolve a
	 * caller-supplied template.
	 */
	public function test_read_passes_the_request_to_the_filter() {
		$seen = null;

		$this->add_temporary_filter(
			'jetpack_email_editor_bootstrap',
			static function ( $data, $request ) use ( &$seen ) {
				$seen = $request;
				return array( 'ok' => true );
			}
		);

		$this->server->dispatch( $this->request( Requests::GET, array( 'template_slug' => 'wpcom-new-post' ) ) );

		$this->assertInstanceOf( WP_REST_Request::class, $seen );
		$this->assertSame( 'wpcom-new-post', $seen->get_param( 'template_slug' ) );
	}

	/**
	 * Test that a filter which has already produced a value is passed it, rather than the endpoint
	 * overriding whatever ran before.
	 */
	public function test_read_filter_receives_a_null_default() {
		$seen = 'untouched';

		$this->add_temporary_filter(
			'jetpack_email_editor_bootstrap',
			static function ( $data ) use ( &$seen ) {
				$seen = $data;
				return array( 'ok' => true );
			}
		);

		$this->server->dispatch( $this->request( Requests::GET ) );

		// WordPress.com's implementations short-circuit on a non-null value, so the default the
		// endpoint passes has to be null or they never run.
		$this->assertNull( $seen );
	}

	/**
	 * Test that the write returns whatever the filter provides.
	 */
	public function test_write_returns_the_filtered_result() {
		$stored = array(
			'blog_id' => 1234,
			'design'  => $this->design(),
		);

		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function () use ( $stored ) {
				return $stored;
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $stored, $response->get_data() );
	}

	/**
	 * Test that the design reaches the filter.
	 */
	public function test_write_passes_the_design_to_the_filter() {
		$seen = null;

		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function ( $result, $request ) use ( &$seen ) {
				$seen = $request->get_param( 'design' );
				return array( 'design' => $seen );
			}
		);

		$this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertSame( $this->design(), $seen );
	}

	/**
	 * Test that a PUT saves, not only a POST.
	 */
	public function test_write_accepts_put() {
		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function ( $result, $request ) {
				return array( 'design' => $request->get_param( 'design' ) );
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::PUT, array( 'design' => $this->design() ) ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( $this->design(), $response->get_data()['design'] );
	}

	/**
	 * Test that a write with no design is refused before anything is called.
	 */
	public function test_write_requires_a_design() {
		$called = false;

		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function () use ( &$called ) {
				$called = true;
				return array();
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::POST ) );

		$this->assertErrorResponse( 'rest_missing_callback_param', $response, 400 );
		$this->assertFalse( $called, 'The filter should not run for a request with no design.' );
	}

	/**
	 * Test that an unimplemented read reports as unavailable rather than as an empty design.
	 *
	 * This is the failure mode the data layer exists to avoid: a site whose WordPress.com half has
	 * not shipped must not look like a site whose email design is genuinely empty.
	 */
	public function test_read_without_an_implementation_is_not_an_empty_bundle() {
		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertErrorResponse( 'email_editor_unavailable', $response, 501 );
	}

	/**
	 * Test that an unimplemented write reports as unavailable rather than as a successful save.
	 */
	public function test_write_without_an_implementation_is_not_a_silent_success() {
		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertErrorResponse( 'email_editor_unavailable', $response, 501 );
	}

	/**
	 * Test that an error from the filter reaches the client unchanged, so the screen can show what
	 * went wrong rather than a generic failure.
	 */
	public function test_an_error_from_the_filter_is_returned_as_is() {
		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function () {
				return new WP_Error(
					'email_editor_design_not_saved',
					'The email design could not be saved.',
					array( 'status' => 500 )
				);
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertErrorResponse( 'email_editor_design_not_saved', $response, 500 );
	}

	/**
	 * Test that a filter which raises becomes an error response rather than a fatal.
	 *
	 * On Simple the filter runs in this process, so an implementation that throws would otherwise
	 * take the request down with nothing for the screen to display.
	 */
	public function test_a_throwing_filter_becomes_an_error_response() {
		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			/**
			 * @return never
			 */
			static function () {
				throw new RuntimeException( 'the store raised' );
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertErrorResponse( 'email_editor_failed', $response, 500 );
	}

	/**
	 * Test that a raising read is caught too.
	 */
	public function test_a_throwing_read_filter_becomes_an_error_response() {
		$this->add_temporary_filter(
			'jetpack_email_editor_bootstrap',
			/**
			 * @return never
			 */
			static function () {
				throw new RuntimeException( 'the bootstrap raised' );
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertErrorResponse( 'email_editor_failed', $response, 500 );
	}

	/**
	 * Test that an unconnected user cannot reach the endpoint, on the path every Atomic and
	 * self-hosted site takes.
	 *
	 * This pins the guarantee, not the line that enforces it, and is worth being precise about: the
	 * endpoint's permission callback and the connection package's proxy both refuse an unconnected
	 * user with this same `rest_unauthorized`, so nothing asserted here can tell them apart and
	 * removing either one alone leaves this green. What it does hold is the contract a caller depends
	 * on — a site with no connection is refused, rather than served or left waiting on a request that
	 * cannot be made.
	 */
	public function test_an_unconnected_user_cannot_reach_the_endpoint_off_simple() {
		$this->register_routes_as_non_simple();

		$this->assertErrorResponse(
			'rest_unauthorized',
			$this->server->dispatch( $this->request( Requests::GET ) ),
			403
		);
		$this->assertErrorResponse(
			'rest_unauthorized',
			$this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) ),
			403
		);
	}

	/**
	 * Test that a read implementation returning something other than a bundle is not served as one.
	 *
	 * `false` is how PHP conventionally reports failure, so an implementation that fails this way must
	 * not reach the screen as a successful, empty design.
	 */
	public function test_read_rejects_a_non_array_filter_return() {
		$this->add_temporary_filter( 'jetpack_email_editor_bootstrap', '__return_false' );

		$response = $this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertErrorResponse( 'email_editor_unavailable', $response, 501 );
	}

	/**
	 * Test that a write implementation returning something other than a stored design is not reported
	 * as a successful save.
	 */
	public function test_write_rejects_a_non_array_filter_return() {
		$this->add_temporary_filter(
			'jetpack_email_editor_save_design',
			static function () {
				return 'saved';
			}
		);

		$response = $this->server->dispatch( $this->request( Requests::POST, array( 'design' => $this->design() ) ) );

		$this->assertErrorResponse( 'email_editor_unavailable', $response, 501 );
	}

	/**
	 * Test that a raising filter is announced, so a host can log what this plugin deliberately does not.
	 */
	public function test_a_throwing_filter_fires_the_error_action() {
		$seen = null;

		$this->add_temporary_filter(
			'jetpack_email_editor_bootstrap',
			/**
			 * @return never
			 */
			static function () {
				throw new RuntimeException( 'the bootstrap raised' );
			}
		);

		$this->add_temporary_filter(
			'jetpack_email_editor_error',
			static function ( $e ) use ( &$seen ) {
				$seen = $e;
			}
		);

		$this->server->dispatch( $this->request( Requests::GET ) );

		$this->assertInstanceOf( RuntimeException::class, $seen );
		$this->assertSame( 'the bootstrap raised', $seen->getMessage() );
	}
}
