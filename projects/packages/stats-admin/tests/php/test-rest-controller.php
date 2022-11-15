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
	const SUPPORTED_ROUTES = array(
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
		'/jetpack/v4/stats-app/sites/999/stats/streak',
		'/jetpack/v4/stats-app/sites/999/stats/tags',
		'/jetpack/v4/stats-app/sites/999/stats/followers',
		'/jetpack/v4/stats-app/sites/999/stats/publicize',
		'/jetpack/v4/stats-app/sites/999/stats/comments',
		'/jetpack/v4/stats-app/sites/999/stats/comment-follower',

		// TODO: investigate how we could remove these calls.
		// '/jetpack/v4/stats-app/sites/999/rewind',
		// '/jetpack/v4/stats-app/sites/999/plugins',
		// '/jetpack/v4/stats-app/sites/999/keyrings',
		// '/jetpack/v4/stats-app/me/connections',
		// '/jetpack/v4/stats-app/jetpack-blogs/999/rest-api/',
		// '/jetpack/v4/stats-app/sites/999/sharing-buttons',
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
	 * Test /stats exists.
	 */
	public function test_blog_stats_endpoint_exists() {
		wp_set_current_user( $this->admin_id );
		foreach ( self::SUPPORTED_ROUTES as $route ) {
			$this->assert_route_exists( $route );
		}
	}

	/**
	 * Ensure required routes exists
	 *
	 * @param string $route The route to check.
	 */
	public function assert_route_exists( $route ) {
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_header( 'content-type', 'application/json' );
		$response = $this->server->dispatch( $request );

		$this->assertNotEquals( 'rest_no_route', $response->get_data()['code'] );
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
}
