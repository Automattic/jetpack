<?php
/**
 * Tests for /wpcom/v2/external-media endpoints.
 */

use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V3_Endpoint_Blogging_Prompts_Test
 */
class WPCOM_REST_API_V3_Endpoint_Blogging_Prompts_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock admin user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Mock subscriber user ID.
	 *
	 * @var int
	 */
	private static $subscriber_id = 0;

	/**
	 * Mock blog ID.
	 *
	 * @var int
	 */
	private static $blog_id = 123;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		static::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( static::$user_id );

		add_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );
		add_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		remove_filter( 'pre_option_jetpack_options', array( $this, 'mock_jetpack_options' ) );

		parent::tear_down();
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint without authorization.
	 */
	public function test_get_blogging_prompts_no_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_prompts', $response, 401 );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with insufficient permissions.
	 */
	public function test_get_blogging_prompts_with_insufficient_permissions() {
		wp_set_current_user( static::$subscriber_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_prompts', $response, 403 );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with invalid query args.
	 */
	public function test_get_blogging_prompts_with_invalid_args() {
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$request->set_query_params(
			array(
				'after'      => 'dummy',
				'before'     => 'dummy',
				'force_year' => 'dummy',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_invalid_param', $response, 400 );
		$this->assertSame( 'Invalid parameter(s): after, before, force_year', $response->get_data()['message'] );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with error response from WPCOM.
	 */
	public function test_get_blogging_prompts_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_blogging_prompts_remote_error' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with successful response from WPCOM.
	 */
	public function test_get_blogging_prompts_success() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_blogging_prompts_remote_success' ), 10, 3 );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$request->set_query_params(
			array(
				'after'      => '2024-02-28',
				'before'     => '2024-03-28',
				'force_year' => '2024',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with no connected admin.
	 */
	public function test_get_blogging_prompts_with_non_connected_admin() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_blogging_prompts_remote_success' ), 10, 3 );

		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$request->set_query_params(
			array(
				'after'      => '2024-02-28',
				'before'     => '2024-03-28',
				'force_year' => '2024',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * Tests GET 'blogging-prompts' endpoint with no connected admin and no site connection.
	 */
	public function test_get_blogging_prompts_with_non_connected_admin_no_site_connection() {
		remove_filter( 'pre_option_jetpack_private_options', array( $this, 'mock_jetpack_private_options' ) );

		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts' );
		$request->set_query_params(
			array(
				'after'      => '2024-02-28',
				'before'     => '2024-03-28',
				'force_year' => '2024',
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_unauthorized', $response, 403 );
		$this->assertSame( 'Please connect your user account to WordPress.com', $response->get_data()['message'] );
	}

		/**
		 * Tests GET 'blogging-prompts/[id]' endpoint without authorization.
		 */
	public function test_get_blogging_prompt_no_auth() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts/1' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_prompts', $response, 401 );
	}

	/**
	 * Tests GET 'blogging-prompts/[id] endpoint with insufficient permissions.
	 */
	public function test_get_blogging_prompt_with_insufficient_permissions() {
		wp_set_current_user( static::$subscriber_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts/1' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_read_prompts', $response, 403 );
	}

	/**
	 * Tests GET 'blogging-prompts/[id]' endpoint with error response from WPCOM.
	 */
	public function test_get_blogging_prompt_with_remote_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_wpcom_api_response_blogging_prompt_remote_error' ), 10, 3 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v3/blogging-prompts/1' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'dummy_error', $response, 500 );
	}

	/**
	 * Tests that modify_query() leaves queries for other post types alone.
	 */
	public function test_modify_query_ignores_other_post_types() {
		$endpoint = new WPCOM_REST_API_V3_Endpoint_Blogging_Prompts();
		$original = array(
			array(
				'column' => 'post_date',
				'after'  => '--02-28',
			),
		);

		$query = new WP_Query();
		$query->set( 'post_type', 'wp_global_styles' );
		$query->set( 'date_query', $original );

		$endpoint->modify_query( $query );

		$this->assertSame( $original, $query->get( 'date_query' ) );
		$this->assertSame( '', $query->get( 'jetpack_blogging_prompts' ) );
		$this->assertSame( 0, $endpoint->day_of_year_query );
	}

	/**
	 * Tests that modify_query() does not warn on a query that has no date_query.
	 */
	public function test_modify_query_without_a_date_query_does_not_warn() {
		$endpoint = new WPCOM_REST_API_V3_Endpoint_Blogging_Prompts();

		$query = new WP_Query();
		$query->set( 'post_type', 'post' );

		$errors = array();
		set_error_handler(
			function ( $errno, $errstr ) use ( &$errors ) {
				$errors[] = $errstr;
				return true;
			}
		);
		$endpoint->modify_query( $query );
		restore_error_handler();

		$this->assertSame( array(), $errors );
		$this->assertSame( '', $query->get( 'jetpack_blogging_prompts' ) );
	}

	/**
	 * Tests that filter_sql() leaves untagged queries alone even with a day-of-year query pending.
	 */
	public function test_filter_sql_ignores_untagged_queries() {
		$endpoint                    = new WPCOM_REST_API_V3_Endpoint_Blogging_Prompts();
		$endpoint->day_of_year_query = 59;
		$endpoint->force_year        = 2026;

		$query = new WP_Query();
		$query->set( 'post_type', 'wp_global_styles' );

		$clauses = $this->get_sample_clauses();

		$this->assertSame( $clauses, $endpoint->filter_sql( $clauses, $query ) );
	}

	/**
	 * Tests that filter_sql() still rewrites the prompts query it was written for.
	 */
	public function test_filter_sql_modifies_the_tagged_prompts_query() {
		$endpoint             = new WPCOM_REST_API_V3_Endpoint_Blogging_Prompts();
		$endpoint->force_year = 2026;

		$query = new WP_Query();
		$query->set( 'post_type', 'post' );
		$query->set(
			'date_query',
			array(
				array(
					'column' => 'post_date',
					'after'  => '--02-28',
				),
			)
		);

		$endpoint->modify_query( $query );

		$this->assertTrue( $query->get( 'jetpack_blogging_prompts' ) );
		$this->assertSame( 59, $endpoint->day_of_year_query );

		$clauses = $endpoint->filter_sql( $this->get_sample_clauses(), $query );

		$this->assertStringContainsString( 'day_of_year', $clauses['fields'] );
		$this->assertStringContainsString( 'newest_prompts', $clauses['join'] );
		$this->assertStringContainsString( 'day_of_year', $clauses['orderby'] );
	}

	/**
	 * SQL clauses shaped like the wp_global_styles lookup that runs while prompts are rendered.
	 *
	 * @return array
	 */
	private function get_sample_clauses() {
		global $wpdb;

		return array(
			'distinct' => '',
			'fields'   => "{$wpdb->posts}.ID",
			'join'     => " LEFT JOIN {$wpdb->term_relationships} ON ({$wpdb->posts}.ID = {$wpdb->term_relationships}.object_id)",
			'where'    => " AND {$wpdb->term_relationships}.term_taxonomy_id IN (1)",
			'groupby'  => "{$wpdb->posts}.ID",
			'orderby'  => "{$wpdb->posts}.post_date DESC",
			'limits'   => 'LIMIT 0, 1',
		);
	}

	/**
	 * Mock the user token.
	 *
	 * @return array
	 */
	public function mock_jetpack_private_options() {
		return array(
			'user_tokens' => array(
				static::$user_id => 'pretend_this_is_valid.secret.' . static::$user_id,
			),
			'blog_token'  => 'blog.token',
		);
	}

	/**
	 * Mock Jetpack options.
	 *
	 * @return array
	 */
	public function mock_jetpack_options() {
		return array(
			'id' => static::$blog_id,
		);
	}

	/**
	 * Validate the Jetpack API request for fetching blogging prompts and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_blogging_prompts_remote_success( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v3/sites/' . static::$blog_id . '/blogging-prompts?after=2024-02-28&before=2024-03-28&force_year=2024', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '[]',
			'status_code' => 200,
			'response'    => array(
				'code' => 200,
			),
		);
	}

	/**
	 * Validate the "list" Jetpack API request for products and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_blogging_prompts_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v3/sites/' . static::$blog_id . '/blogging-prompts', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}

	/**
	 * Validate the Jetpack API request for fetching a single blogging prompt and mock the response.
	 *
	 * @param bool   $response Whether to preempt an HTTP request's return value. Default false.
	 * @param array  $args     HTTP request arguments.
	 * @param string $url      The request URL.
	 * @return array
	 */
	public function mock_wpcom_api_response_blogging_prompt_remote_error( $response, $args, $url ) {
		$this->assertEquals( Requests::GET, $args['method'] );
		$this->assertStringStartsWith( 'https://public-api.wordpress.com/wpcom/v3/sites/' . static::$blog_id . '/blogging-prompts/1', $url );

		return array(
			'headers'     => array(
				'Allow' => 'GET',
			),
			'body'        => '{"code":"dummy_error","message":"Oops","data":{"status":500}}',
			'status_code' => 500,
			'response'    => array(
				'code' => 500,
			),
		);
	}
}
