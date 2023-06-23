<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_REST_Controller extends Stats_Test_Case {
	const SUPPORTED_GET_ROUTES = array(
		'/jetpack/v4/stats-app/sites/999/stats/visits',
		'/jetpack/v4/stats-app/sites/999/stats/highlights',
		'/jetpack/v4/stats-app/sites/999/stats',
		'/jetpack/v4/stats-app/sites/999/stats/top-posts',
		'/jetpack/v4/stats-app/sites/999/stats/search-terms',
		'/jetpack/v4/stats-app/sites/999/stats/country-views',
		'/jetpack/v4/stats-app/sites/999/stats/clicks',
		'/jetpack/v4/stats-app/sites/999/stats/referrers',
		'/jetpack/v4/stats-app/sites/999/stats/top-authors',
		'/jetpack/v4/stats-app/sites/999/stats/video-plays',
		'/jetpack/v4/stats-app/sites/999/posts',
		'/jetpack/v4/stats-app/sites/999/posts/1000',
		'/jetpack/v4/stats-app/sites/999/posts/1000/likes',
		'/jetpack/v4/stats-app/sites/999/stats/streak',
		'/jetpack/v4/stats-app/sites/999/stats/tags',
		'/jetpack/v4/stats-app/sites/999/stats/followers',
		'/jetpack/v4/stats-app/sites/999/stats/file-downloads',
		'/jetpack/v4/stats-app/sites/999/stats/insights',
		'/jetpack/v4/stats-app/sites/999/stats/publicize',
		'/jetpack/v4/stats-app/sites/999/stats/comments',
		'/jetpack/v4/stats-app/sites/999/stats/comment-followers',
		'/jetpack/v4/stats-app/sites/999/stats/subscribers',
		'/jetpack/v4/stats-app/sites/999/stats/post/1',
		'/jetpack/v4/stats-app/sites/999/stats/video/1',
		'/jetpack/v4/stats-app/sites/999/site-has-never-published-post',
		'/jetpack/v4/stats-app/sites/999/subscribers/counts',
	);

	const SUPPORTED_POST_ROUTES = array(
		'/jetpack/v4/stats-app/sites/999/stats/referrers/spam/new',
		'/jetpack/v4/stats-app/sites/999/stats/referrers/spam/delete',
	);

	const UNSUPPORTED_ROUTES = array(
		'/jetpack/v4/stats-app/sites/999/stats/this-is-not-supported',
		'/jetpack/v4/stats-app/sites/999/rewind',
		'/jetpack/v4/stats-app/sites/999/stats/some-post-type/1',
	);

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	protected $server;

	/**
	 * An instance of REST_Controller
	 *
	 * @var REST_Controller
	 */
	protected $rest_controller;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		wp_set_current_user( 0 );

		$this->rest_controller = new REST_Controller();

		// Register REST routes.
		add_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		remove_action( 'rest_api_init', array( $this->rest_controller, 'register_rest_routes' ) );
		parent::tear_down();
	}

	/**
	 * Test GET routes exists.
	 */
	public function test_blog_stats_get_endpoints_exists() {
		wp_set_current_user( $this->admin_id );
		foreach ( self::SUPPORTED_GET_ROUTES as $route ) {
			$this->assert_get_route_exists( $route );
		}
	}

	/**
	 * Test POST routes exists.
	 */
	public function test_blog_stats_post_endpoints_exists() {
		wp_set_current_user( $this->admin_id );
		foreach ( self::SUPPORTED_POST_ROUTES as $route ) {
			$this->assert_post_route_exists( $route );
		}
	}

	/**
	 * Test not supported endpoints.
	 */
	public function test_blog_stats_endpoints_not_supported() {
		wp_set_current_user( $this->admin_id );
		foreach ( self::UNSUPPORTED_ROUTES as $route ) {
			$this->assert_route_not_supported( $route );
		}
	}

	/**
	 * Ensure required routes exists
	 *
	 * @param string $route The route to check.
	 */
	public function assert_get_route_exists( $route ) {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertNotEquals( 404, $response->get_status() );
	}

	/**
	 * Ensure required routes exists
	 *
	 * @param string $route The route to check.
	 */
	public function assert_post_route_exists( $route ) {
		$request = new WP_REST_Request( 'POST', $route );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertNotEquals( 404, $response->get_status() );
	}

	/**
	 * Ensure required routes exists
	 *
	 * @param string $route The route to check.
	 */
	public function assert_route_not_supported( $route ) {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertNotEquals( 200, $response->get_status() );
	}

	/**
	 * Test '/jetpack/v4/stats-app/sites/999/site-has-never-published-post'
	 */
	public function test_site_has_never_published_post() {
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/stats-app/sites/999/site-has-never-published-post' );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertNotTrue( $response );
	}

	/**
	 * Test '/jetpack/v4/stats-app/stats/notices' succeed.
	 */
	public function test_stats_notices_succeed() {
		wp_set_current_user( $this->admin_id );
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/stats-app/sites/999/jetpack-stats-dashboard/notices' );
		$request->set_body_params(
			array(
				'id'     => 'new_stats_feedback',
				'status' => 'dismissed',
			)
		);
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test '/jetpack/v4/stats-app/stats/notices' failed
	 */
	public function test_stats_notices_illegal_params() {
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/stats-app/sites/999/jetpack-stats-dashboard/notices' );
		$request->set_body_params(
			array(
				'id' => 'new_stats_feedback',
			)
		);
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 * Test filter_and_build_query_string.
	 */
	public function test_filter_and_build_query_string() {
		$filter_and_build_query_string = new \ReflectionMethod( $this->rest_controller, 'filter_and_build_query_string' );
		$filter_and_build_query_string->setAccessible( true );

		$this->assertEquals(
			'c=d&e=f',
			$filter_and_build_query_string->invoke(
				$this->rest_controller,
				array(
					'a'          => 'b',
					'c'          => 'd',
					'rest_route' => '/jetpack/v4/test-route',
					'e'          => 'f',
				),
				array( 'a' )
			)
		);
		$this->assertEquals(
			'a=b&c=d&e=f',
			$filter_and_build_query_string->invoke(
				$this->rest_controller,
				array(
					'a'          => 'b',
					'c'          => 'd',
					'rest_route' => '/jetpack/v4/test-route',
					'e'          => 'f',
				)
			)
		);
		$this->assertEquals(
			'',
			$filter_and_build_query_string->invoke(
				$this->rest_controller,
				array()
			)
		);
	}

	/**
	 * Test filter_and_build_query_string.
	 */
	public function test_get_wp_error() {
		$get_wp_error = new \ReflectionMethod( WPCOM_Client::class, 'get_wp_error' );
		$get_wp_error->setAccessible( true );

		$error = $get_wp_error->invoke(
			$this->rest_controller,
			array(
				'error'   => 'err1',
				'message' => 'msg1',
			),
			500
		);
		$this->assertEquals(
			'err1',
			$error->get_error_code()
		);

		$error = $get_wp_error->invoke(
			$this->rest_controller,
			array(
				'code'    => 'err2',
				'message' => 'msg1',
			),
			500
		);
		$this->assertEquals(
			'err2',
			$error->get_error_code()
		);

		$error = $get_wp_error->invoke(
			$this->rest_controller,
			array(
				'code' => 'err2',
			),
			500
		);
		$this->assertEquals(
			'unknown remote error',
			$error->get_error_message()
		);
	}
}
