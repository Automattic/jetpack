<?php
/**
 * Unit Tests for Jetpack_Form.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\ContactForm;

use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the the Jetpack_Form REST endpoint.
 *
 * To run this test, you can use the following command: (from the projects/packages/forms directory)
 *
 * composer test-php tests/php/contact-form/Jetpack_Form_Endpoint_Test.php
 */
class Jetpack_Form_Endpoint_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The status-count query stub filter currently registered, if any.
	 *
	 * @var callable|null
	 */
	private $status_count_filter = null;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		do_action( 'rest_api_init' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		if ( null !== $this->status_count_filter ) {
			remove_filter( 'wordbless_wpdb_query_results', $this->status_count_filter, 10 );
			$this->status_count_filter = null;
		}

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();

		// Unregister the post types if they were registered
		unregister_post_type( 'jetpack_form' );
		unregister_post_type( 'feedback' );
	}

	/**
	 * Test that the post type is registered when init is called.
	 */
	public function test_init_registers_post_type() {
		Contact_Form::register_post_type();

		$this->assertTrue( post_type_exists( 'jetpack_form' ), 'jetpack_form post type should be registered' );
	}

	/**
	 * Test that the post type has the correct configuration.
	 */
	public function test_post_type_configuration() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertNotNull( $post_type_object, 'Post type object should exist' );
		$this->assertEquals( 'jetpack_form', $post_type_object->name );
		$this->assertFalse( $post_type_object->public, 'Post type should not be public' );
		$this->assertTrue( $post_type_object->show_ui, 'Post type should show UI' );
		$this->assertFalse( $post_type_object->show_in_menu, 'Post type should not show in menu' );
		$this->assertTrue( $post_type_object->show_in_rest, 'Post type should be available in REST' );
		$this->assertEquals( 'jetpack-forms', $post_type_object->rest_base, 'REST base should be jetpack-forms' );
	}

	/**
	 * Test that the post type supports the correct features.
	 */
	public function test_post_type_supports() {
		Contact_Form::register_post_type();

		$this->assertTrue( post_type_supports( 'jetpack_form', 'title' ), 'Should support title' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'editor' ), 'Should support editor' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'revisions' ), 'Should support revisions' );
		$this->assertTrue( post_type_supports( 'jetpack_form', 'author' ), 'Should support author' );
	}

	/**
	 * Test that the REST endpoints are registered.
	 */
	public function test_rest_endpoints_are_registered() {
		Contact_Form::register_post_type();

		// Re-initialize REST server to pick up new routes
		do_action( 'rest_api_init' );

		$routes = $this->server->get_routes();

		$this->assertArrayHasKey( '/wp/v2/jetpack-forms', $routes, 'Main endpoint should be registered' );
		$this->assertArrayHasKey( '/wp/v2/jetpack-forms/(?P<id>[\d]+)', $routes, 'Single item endpoint should be registered' );
	}

	/**
	 * Test that GET request to jetpack-forms endpoint works.
	 */
	public function test_get_jetpack_forms_returns_200() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET request should return 200' );
		$this->assertIsArray( $response->get_data(), 'Response should be an array' );
	}

	/**
	 * Test that users without edit_posts capability cannot access jetpack-forms endpoint.
	 */
	public function test_get_jetpack_forms_unauthorized_returns_401() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Create a subscriber user (no edit_posts capability)
		$subscriber_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms' );
		$response = $this->server->dispatch( $request );

		$this->assertContains( $response->get_status(), array( 401, 403 ), 'Unauthorized request should return 401 or 403' );
	}

	/**
	 * Test creating a jetpack-form via REST API.
	 */
	public function test_create_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'publish_posts' );

		$request = new WP_REST_Request( 'POST', '/wp/v2/jetpack-forms' );
		$request->set_param( 'title', 'Test Reusable Form' );
		$request->set_param( 'status', 'publish' );
		$request->set_param( 'content', '<!-- wp:jetpack/contact-form --><div class="wp-block-jetpack-contact-form">Test Form</div><!-- /wp:jetpack/contact-form -->' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 201, $response->get_status(), 'POST request should return 201' );

		$data  = $response->get_data();
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Test Reusable Form', $title, 'Title should match' );
		$this->assertEquals( 'publish', $data['status'], 'Status should be publish' );
	}

	/**
	 * Test retrieving a specific jetpack-form via REST API.
	 */
	public function test_get_single_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Single Test Form',
				'post_content' => 'Form content',
				'post_status'  => 'publish',
			)
		);

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'GET single item should return 200' );

		$data = $response->get_data();
		// Title might be in different formats depending on context
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Single Test Form', $title, 'Title should match' );
		$this->assertEquals( $post_id, $data['id'], 'ID should match' );
	}

	/**
	 * A form block with no destination configured.
	 */
	private const BROKEN_FORM_CONTENT = '<!-- wp:jetpack/contact-form {"emailNotifications":false,"saveResponses":false} --><!-- /wp:jetpack/contact-form -->';

	/**
	 * A form block left at its (collecting) defaults.
	 */
	private const HEALTHY_FORM_CONTENT = '<!-- wp:jetpack/contact-form --><!-- /wp:jetpack/contact-form -->';

	/**
	 * Helper to insert a jetpack_form with the given block content.
	 *
	 * @param string $title   Post title.
	 * @param string $content Block content.
	 * @return int Post ID.
	 */
	private function insert_form( string $title, string $content ): int {
		return wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => $title,
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);
	}

	/**
	 * A broken single (edit-context) form fetch reports is_collecting_responses=false.
	 *
	 * Covers prepare_item_for_response() -> is_form_collecting_responses() ->
	 * find_contact_form_attributes() for a form that drops its submissions.
	 */
	public function test_single_broken_form_is_not_collecting() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$broken = $this->insert_form( 'Broken Single', self::BROKEN_FORM_CONTENT );

		$request = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $broken );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'is_collecting_responses', $data );
		$this->assertFalse( $data['is_collecting_responses'] );
	}

	/**
	 * A contact-form block nested inside another block is still detected.
	 *
	 * Covers the recursive innerBlocks branch of find_contact_form_attributes().
	 */
	public function test_nested_broken_form_is_not_collecting() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$nested = $this->insert_form(
			'Nested Broken',
			'<!-- wp:group --><div class="wp-block-group">' . self::BROKEN_FORM_CONTENT . '</div><!-- /wp:group -->'
		);

		$request = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $nested );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertFalse( $response->get_data()['is_collecting_responses'] );
	}

	/**
	 * A form post with no contact-form block defaults to collecting (no warning).
	 *
	 * Covers the "no block found" and empty-content fall-throughs.
	 */
	public function test_form_without_contact_block_defaults_to_collecting() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$no_block = $this->insert_form( 'No Block', '<!-- wp:paragraph --><p>Just text.</p><!-- /wp:paragraph -->' );
		$empty    = $this->insert_form( 'Empty', '' );

		foreach ( array( $no_block, $empty ) as $id ) {
			$request = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $id );
			$request->set_param( 'context', 'edit' );
			$response = $this->server->dispatch( $request );
			$this->assertTrue( $response->get_data()['is_collecting_responses'], "Form $id should default to collecting" );
		}
	}

	/**
	 * A healthy single (edit-context) form fetch reports is_collecting_responses=true.
	 */
	public function test_single_healthy_form_is_collecting() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$healthy = $this->insert_form( 'Healthy Single', self::HEALTHY_FORM_CONTENT );

		$request = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $healthy );
		$request->set_param( 'context', 'edit' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'is_collecting_responses', $data );
		$this->assertTrue( $data['is_collecting_responses'] );
	}

	/**
	 * The flag is omitted from non-edit (view) context responses.
	 */
	public function test_is_collecting_responses_absent_in_view_context() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$broken = $this->insert_form( 'Broken View', self::BROKEN_FORM_CONTENT );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/' . $broken );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'is_collecting_responses', $response->get_data() );
	}

	/**
	 * Test updating a jetpack-form via REST API.
	 */
	public function test_update_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'edit_published_posts' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Original Title',
				'post_content' => 'Original content',
				'post_status'  => 'publish',
			)
		);

		$request = new WP_REST_Request( 'PUT', '/wp/v2/jetpack-forms/' . $post_id );
		$request->set_param( 'title', 'Updated Title' );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'PUT request should return 200' );

		$data  = $response->get_data();
		$title = $data['title']['raw'] ?? $data['title']['rendered'];
		$this->assertEquals( 'Updated Title', $title, 'Title should be updated' );
	}

	/**
	 * Test deleting a jetpack-form via REST API.
	 */
	public function test_delete_jetpack_form_via_rest() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Ensure user has proper capabilities
		$user = wp_get_current_user();
		$user->add_cap( 'delete_posts' );
		$user->add_cap( 'delete_published_posts' );

		// Create a form first
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'jetpack_form',
				'post_title'   => 'Form to Delete',
				'post_content' => 'Form content',
				'post_status'  => 'publish',
			)
		);

		$request  = new WP_REST_Request( 'DELETE', '/wp/v2/jetpack-forms/' . $post_id );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'DELETE request should return 200' );

		// Verify the post is trashed
		$post = get_post( $post_id );
		$this->assertEquals( 'trash', $post->post_status, 'Post should be in trash' );
	}

	/**
	 * Test that the REST controller class is correctly assigned.
	 */
	public function test_rest_controller_class() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertEquals(
			'Automattic\Jetpack\Forms\ContactForm\Jetpack_Form_Endpoint',
			$post_type_object->rest_controller_class,
			'REST controller class should be correctly set'
		);
	}

	/**
	 * Test that the post type has correct capability mappings.
	 */
	public function test_post_type_capabilities() {
		Contact_Form::register_post_type();

		$post_type_object = get_post_type_object( 'jetpack_form' );

		$this->assertEquals( 'edit_posts', $post_type_object->cap->read, 'Read capability should be edit_posts' );
		$this->assertEquals( 'publish_posts', $post_type_object->cap->create_posts, 'Create capability should be publish_posts' );
		$this->assertEquals( 'edit_posts', $post_type_object->cap->edit_posts, 'Edit posts capability should be edit_posts' );
	}

	/**
	 * Set the private has_responses_filter property on the endpoint via reflection.
	 *
	 * @param Jetpack_Form_Endpoint $endpoint The endpoint instance.
	 * @param bool                  $value    The filter value.
	 */
	private function set_has_responses_filter( Jetpack_Form_Endpoint $endpoint, bool $value ): void {
		$ref = new \ReflectionProperty( Jetpack_Form_Endpoint::class, 'has_responses_filter' );
		$ref->setValue( $endpoint, $value );
	}

	/**
	 * Create a WP_Query instance targeting the jetpack_form post type, for use in filter_by_responses tests.
	 *
	 * @return \WP_Query
	 */
	private function get_jetpack_form_query(): \WP_Query {
		$query = new \WP_Query();
		$query->set( 'post_type', Contact_Form::POST_TYPE );
		return $query;
	}

	/**
	 * Test that the has_responses REST parameter is registered in collection params.
	 */
	public function test_has_responses_param_is_registered() {
		Contact_Form::register_post_type();

		$endpoint = new Jetpack_Form_Endpoint();
		$params   = $endpoint->get_collection_params();

		$this->assertArrayHasKey( 'has_responses', $params );
		$this->assertEquals( 'string', $params['has_responses']['type'] );
		$this->assertContains( 'true', $params['has_responses']['enum'] );
		$this->assertContains( 'false', $params['has_responses']['enum'] );
		$this->assertSame( '', $params['has_responses']['default'] );
	}

	/**
	 * Test that filter_by_responses adds an EXISTS subquery when has_responses_filter is true.
	 */
	public function test_filter_by_responses_adds_exists_clause() {
		Contact_Form::register_post_type();

		$endpoint = new Jetpack_Form_Endpoint();
		$this->set_has_responses_filter( $endpoint, true );

		$clauses = $endpoint->filter_by_responses( array( 'where' => '' ), $this->get_jetpack_form_query() );

		$this->assertStringContainsString( 'EXISTS', $clauses['where'] );
		$this->assertStringNotContainsString( 'NOT EXISTS', $clauses['where'] );
		$this->assertStringContainsString( 'feedback', $clauses['where'] );
		$this->assertStringContainsString( 'post_parent', $clauses['where'] );
	}

	/**
	 * Test that filter_by_responses adds a NOT EXISTS subquery when has_responses_filter is false.
	 */
	public function test_filter_by_responses_adds_not_exists_clause() {
		Contact_Form::register_post_type();

		$endpoint = new Jetpack_Form_Endpoint();
		$this->set_has_responses_filter( $endpoint, false );

		$clauses = $endpoint->filter_by_responses( array( 'where' => '' ), $this->get_jetpack_form_query() );

		$this->assertStringContainsString( 'NOT EXISTS', $clauses['where'] );
		$this->assertStringContainsString( 'feedback', $clauses['where'] );
		$this->assertStringContainsString( 'post_parent', $clauses['where'] );
	}

	/**
	 * Test that filter_by_responses only checks publish and draft feedback statuses.
	 */
	public function test_filter_by_responses_checks_publish_and_draft_statuses() {
		Contact_Form::register_post_type();

		$endpoint = new Jetpack_Form_Endpoint();
		$this->set_has_responses_filter( $endpoint, true );

		$clauses = $endpoint->filter_by_responses( array( 'where' => '' ), $this->get_jetpack_form_query() );

		$this->assertStringContainsString( "'publish'", $clauses['where'] );
		$this->assertStringContainsString( "'draft'", $clauses['where'] );
	}

	/**
	 * Test that filter_by_responses preserves existing where clauses.
	 */
	public function test_filter_by_responses_preserves_existing_where() {
		Contact_Form::register_post_type();

		$endpoint = new Jetpack_Form_Endpoint();
		$this->set_has_responses_filter( $endpoint, true );

		$existing_where = "AND post_type = 'jetpack_form'";
		$clauses        = $endpoint->filter_by_responses( array( 'where' => $existing_where ), $this->get_jetpack_form_query() );

		$this->assertStringContainsString( $existing_where, $clauses['where'] );
		$this->assertStringContainsString( 'EXISTS', $clauses['where'] );
	}

	/**
	 * Capture and stub the grouped status-count SQL query.
	 *
	 * The forms package runs tests against WorDBless' "dbless" engine, which does not
	 * execute real aggregate SQL. We hook its query filter to (a) record the query the
	 * endpoint runs so we can assert how it is scoped, and (b) return controlled rows so
	 * the response shape can be asserted.
	 *
	 * @param array $captured_queries  Reference that receives each matching query string.
	 * @param array $rows              Map of post_status => count to return for the query.
	 * @param array $required_fragments Query fragments that must be present before returning stubbed rows.
	 */
	private function stub_status_count_query( array &$captured_queries, array $rows, array $required_fragments = array() ): void {
		$this->status_count_filter = function ( $results, $query ) use ( &$captured_queries, $rows, $required_fragments ) {
			if ( false === strpos( $query, 'GROUP BY post_status' ) ) {
				return $results;
			}

			$captured_queries[] = $query;

			foreach ( $required_fragments as $fragment ) {
				if ( false === strpos( $query, $fragment ) ) {
					return $results;
				}
			}

			$stubbed = array();
			foreach ( $rows as $status => $count ) {
				$stubbed[] = (object) array(
					'post_status' => $status,
					'num_posts'   => $count,
				);
			}
			return $stubbed;
		};

		add_filter( 'wordbless_wpdb_query_results', $this->status_count_filter, 10, 2 );
	}

	/**
	 * Dispatch the status-counts endpoint and return the response data.
	 *
	 * @return array The status counts response data.
	 */
	private function dispatch_status_counts(): array {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/status-counts' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status(), 'status-counts request should return 200' );

		return $response->get_data();
	}

	/**
	 * Test that a user who cannot edit others' forms only sees counts for their own forms.
	 */
	public function test_status_counts_scoped_to_author_for_non_editor() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// An author can edit_posts but not edit_others_posts.
		$author_id = wp_insert_user(
			array(
				'user_login' => 'test_author',
				'user_pass'  => '123',
				'role'       => 'author',
			)
		);
		wp_set_current_user( $author_id );

		$captured_queries = array();
		$this->stub_status_count_query(
			$captured_queries,
			array(
				'publish' => 1,
				'draft'   => 2,
				'pending' => 4,
				'trash'   => 8,
			),
			array(
				"post_type = 'jetpack_form'",
				'post_author = ' . $author_id,
			)
		);

		$data = $this->dispatch_status_counts();

		// The query must be scoped to the current author's own forms.
		$this->assertNotEmpty( $captured_queries, 'Author should trigger a direct, author-scoped status query' );
		$this->assertStringContainsString( "post_type = 'jetpack_form'", $captured_queries[0], 'Author query must filter to jetpack_form posts' );
		$this->assertStringContainsString( 'post_author = ' . $author_id, $captured_queries[0], 'Author query must filter by the current author ID' );

		// The response reflects only the author's own counts.
		$this->assertSame(
			array(
				'all'     => 7,
				'publish' => 1,
				'draft'   => 2,
				'pending' => 4,
				'future'  => 0,
				'private' => 0,
				'trash'   => 8,
			),
			$data,
			'Author response should preserve all status-count keys, default missing statuses to zero, and exclude trash from all'
		);
	}

	/**
	 * Test that a user who can edit others' forms still sees site-wide status counts.
	 */
	public function test_status_counts_global_for_editor() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		// Current user is the administrator from setUp(), who can edit_others_posts.
		$captured_queries = array();
		$this->stub_status_count_query(
			$captured_queries,
			array(
				'publish' => 3,
				'draft'   => 2,
			)
		);

		$data = $this->dispatch_status_counts();

		// Admins/editors get site-wide counts via wp_count_posts(), which is not author-scoped.
		$this->assertNotEmpty( $captured_queries, 'Admin should trigger the site-wide status query' );
		$this->assertStringNotContainsString( 'post_author', $captured_queries[0], 'Admin query must not be scoped by author' );

		$this->assertSame( 3, $data['publish'], 'Admin should see every user\'s published forms' );
		$this->assertSame( 2, $data['draft'], 'Admin should see every user\'s draft forms' );
		$this->assertSame( 5, $data['all'], 'Admin "all" count should include every user\'s forms' );
	}

	/**
	 * Test that the status-counts route denies users who cannot edit forms.
	 *
	 * This guards the permission gate on the route so the author-scoped branch is
	 * never reached for a logged-out user (post_author = 0).
	 */
	public function test_status_counts_denied_for_logged_out_user() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/jetpack-forms/status-counts' );
		$response = $this->server->dispatch( $request );

		$this->assertContains( $response->get_status(), array( 401, 403 ), 'Logged-out users must not access status-counts' );
	}

	/**
	 * Test that source post ID meta is stored when creating a form via REST API.
	 */
	public function test_create_jetpack_form_stores_source_post_id_meta() {
		Contact_Form::register_post_type();
		do_action( 'rest_api_init' );

		$user = wp_get_current_user();
		$user->add_cap( 'edit_posts' );
		$user->add_cap( 'publish_posts' );

		$source_post_id = 123;

		$request = new WP_REST_Request( 'POST', '/wp/v2/jetpack-forms' );
		$request->set_param( 'title', 'Form with Source' );
		$request->set_param( 'status', 'publish' );
		$request->set_param( 'content', '<!-- wp:jetpack/contact-form --><!-- /wp:jetpack/contact-form -->' );
		$request->set_param( 'meta', array( '_jetpack_forms_source_post_id' => $source_post_id ) );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 201, $response->get_status(), 'POST request should return 201' );

		$data    = $response->get_data();
		$post_id = $data['id'];

		$stored_meta = get_post_meta( $post_id, '_jetpack_forms_source_post_id', true );
		$this->assertEquals( $source_post_id, (int) $stored_meta, 'Source post ID meta should be stored' );
	}
}
