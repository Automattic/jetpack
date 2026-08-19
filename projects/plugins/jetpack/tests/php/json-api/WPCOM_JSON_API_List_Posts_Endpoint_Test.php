<?php
/**
 * WPCOM_JSON_API_List_Posts_Endpoint unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_List_Posts_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/class.wpcom-json-api-list-posts-endpoint.php';
// Registers every endpoint version (incl. the v1.1 list-posts endpoint that force-adds
// type/status/password) so the fields-parity case below can resolve it.
require_once JETPACK__PLUGIN_DIR . 'json-endpoints.php';
require_once __DIR__ . '/trait-assert-rest-xmlrpc-parity.php';

/**
 * Tests for the /sites/%s/posts/ list posts endpoint.
 *
 * @covers \WPCOM_JSON_API_List_Posts_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_List_Posts_Endpoint::class )]
class WPCOM_JSON_API_List_Posts_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;
	use Assert_Rest_Xmlrpc_Parity;

	/**
	 * An admin user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * An author user ID.
	 *
	 * @var int
	 */
	private static $author_user_id;

	/**
	 * A subscriber user ID.
	 *
	 * @var int
	 */
	private static $subscriber_user_id;

	/**
	 * The current blog ID.
	 *
	 * @var int
	 */
	private static $blog_id;

	private $pre_globals;

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param WP_UnitTest_Factory $factory A factory object.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$author_user_id     = $factory->user->create( array( 'role' => 'author' ) );
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$blog_id = $GLOBALS['blog_id'];
	}

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->pre_globals = $_SERVER;
		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => self::$blog_id );
		wp_set_current_user( self::$admin_user_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		$this->tear_down_rest_parity();

		parent::tear_down();

		$_SERVER = $this->pre_globals;

		WPCOM_JSON_API::init()->token_details = array();
		WPCOM_JSON_API::init()->query         = array();
		wp_set_current_user( 0 );
	}

	/**
	 * Lock the jetpack#42377 fix: with context=edit the post content comes back identically on
	 * both transports. If rest_callback() ever drops the user_can_richedit / comment_edit_pre
	 * filters, the REST body re-escapes the content and this parity assertion fails.
	 *
	 * (Default-request parity for /posts is covered generically by
	 * WPCOM_JSON_API_Rest_Parity_Coverage_Test; this case adds the edit-context input.)
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_xmlrpc_parity_edit_context_locks_jetpack_42377() {
		self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_author'  => self::$admin_user_id,
				'post_content' => 'Café &amp; <!-- wp:paragraph --><b>x</b><!-- /wp:paragraph -->',
			)
		);

		list( $xmlrpc, $rest ) = $this->assert_rest_parity(
			$this->get_endpoint(),
			array(
				'number'  => 5,
				'context' => 'edit',
			)
		);

		$this->assertNotEmpty( $rest['posts'] );
		$this->assertStringContainsString(
			'<b>x</b>',
			$rest['posts'][0]['content'],
			'edit-context returns raw markup on the REST path.'
		);
		$this->assertSame( $xmlrpc['posts'][0]['content'], $rest['posts'][0]['content'] );
	}

	/**
	 * A `fields` request must return the same keys on both transports. get_post_by() force-adds
	 * type/status/password regardless of `fields` because internal processors need them; the
	 * XML-RPC output() path strips the unrequested ones back out via filter_fields(). Before
	 * rest_callback() did the same, those keys leaked past `fields` on the REST transport only.
	 *
	 * Uses the v1.1 endpoint: only it (not v1) force-adds those keys.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_xmlrpc_parity_fields_strips_forced_keys() {
		$this->create_post();

		list( $xmlrpc, $rest ) = $this->assert_rest_parity(
			$this->get_endpoint_v1_1(),
			array(
				'number' => 5,
				'fields' => 'ID,title,date',
			)
		);

		$this->assertNotEmpty( $rest['posts'] );

		$post = $rest['posts'][0];
		$this->assertArrayHasKey( 'ID', $post );
		$this->assertArrayHasKey( 'title', $post );
		$this->assertArrayNotHasKey( 'type', $post );
		$this->assertArrayNotHasKey( 'status', $post );
		$this->assertArrayNotHasKey( 'password', $post );

		// assert_rest_parity() already asserts the full bodies match; this pins the regression.
		$this->assertSame( array_keys( $xmlrpc['posts'][0] ), array_keys( $post ) );
	}

	/**
	 * The v1 endpoint only honors `fields` in display context -- get_post_by() guards the filter
	 * on `'display' === $context`, so an edit-context request renders the full object. Before
	 * rest_callback() ran filter_fields(), that leaked every key on REST while XML-RPC (via
	 * output()) returned only the requested ones. A distinct trigger from the v1.1 force-add.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_xmlrpc_parity_fields_edit_context_v1() {
		$this->create_post();

		list( $xmlrpc, $rest ) = $this->assert_rest_parity(
			$this->get_endpoint(),
			array(
				'number'  => 5,
				'context' => 'edit',
				'fields'  => 'ID,title,date',
			)
		);

		$this->assertNotEmpty( $rest['posts'] );

		$post = $rest['posts'][0];
		$this->assertCount( 3, $post, 'REST returns only the requested fields, not the full object.' );
		$this->assertArrayHasKey( 'ID', $post );
		$this->assertArrayHasKey( 'title', $post );
		$this->assertArrayHasKey( 'date', $post );
		$this->assertArrayNotHasKey( 'content', $post );
		$this->assertSame( array_keys( $xmlrpc['posts'][0] ), array_keys( $post ) );
	}

	/**
	 * Retrieve the registered endpoint instance.
	 *
	 * The endpoint file registers itself via a top-level `new` call when required,
	 * so we look it up from the API's registered endpoints by path and method.
	 *
	 * @return WPCOM_JSON_API_List_Posts_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint() {
		$api = WPCOM_JSON_API::init();
		foreach ( $api->endpoints as $endpoints_by_method ) {
			if (
				isset( $endpoints_by_method['GET'] )
				&& get_class( $endpoints_by_method['GET'] ) === 'WPCOM_JSON_API_List_Posts_Endpoint'
				&& '1' === $endpoints_by_method['GET']->max_version
			) {
				return $endpoints_by_method['GET'];
			}
		}
		$this->fail( 'WPCOM_JSON_API_List_Posts_Endpoint (v1) not found in registered endpoints.' );
	}

	/**
	 * Retrieve the registered v1.1 list-posts endpoint (the version that force-adds
	 * type/status/password in get_post_by()).
	 *
	 * @return WPCOM_JSON_API_List_Posts_v1_1_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint_v1_1() {
		$api = WPCOM_JSON_API::init();
		foreach ( $api->endpoints as $endpoints_by_method ) {
			if (
				isset( $endpoints_by_method['GET'] )
				&& get_class( $endpoints_by_method['GET'] ) === 'WPCOM_JSON_API_List_Posts_v1_1_Endpoint'
				&& '1.1' === $endpoints_by_method['GET']->max_version
			) {
				return $endpoints_by_method['GET'];
			}
		}
		$this->fail( 'WPCOM_JSON_API_List_Posts_v1_1_Endpoint not found in registered endpoints.' );
	}

	/**
	 * Helper to create a published post.
	 *
	 * @param array $args Optional overrides for wp_insert_post.
	 * @return int Post ID.
	 */
	private function create_post( $args = array() ) {
		return wp_insert_post(
			array_merge(
				array(
					'post_title'   => 'Test Post',
					'post_content' => 'Test content.',
					'post_status'  => 'publish',
					'post_type'    => 'post',
					'post_author'  => self::$admin_user_id,
				),
				$args
			)
		);
	}

	/**
	 * Test that the endpoint returns published posts by default.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_returns_published_posts() {
		$post_id = $this->create_post();

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		// Checking the basic data structure.
		$this->assertIsArray( $response['posts'] );
		$this->assertSame( 1, $response['found'] );

		// Making sure there's only one post: the correct one.
		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );
	}

	/**
	 * Test that the endpoint respects the number parameter.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_respects_number_parameter() {
		// Create 3 posts.
		$this->create_post( array( 'post_title' => 'Post 1' ) );
		$this->create_post( array( 'post_title' => 'Post 2' ) );
		$this->create_post( array( 'post_title' => 'Post 3' ) );

		// Request only 2 posts.
		WPCOM_JSON_API::init()->query = array(
			'number'  => 2,
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertCount( 2, $response['posts'] );
		$this->assertEquals( 3, $response['found'] );
	}

	/**
	 * Test that number > 100 returns an error.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_number_over_100_returns_error() {
		WPCOM_JSON_API::init()->query = array(
			'number'  => 101,
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'invalid_number', $response->get_error_code() );
	}

	/**
	 * Test that unknown post types return an error.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_unknown_post_type_returns_error() {
		WPCOM_JSON_API::init()->query = array(
			'type'    => 'nonexistent_type',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'unknown_post_type', $response->get_error_code() );
	}

	/**
	 * Test that logged-out users only see published posts.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_logged_out_users_see_only_published() {
		$this->create_post( array( 'post_status' => 'publish' ) );
		$this->create_post( array( 'post_status' => 'draft' ) );

		wp_set_current_user( 0 );

		WPCOM_JSON_API::init()->query = array(
			'status'  => 'draft',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 0, $response['found'] );
		$this->assertEmpty( $response['posts'] );
	}

	/**
	 * Test that logged-in users can query draft posts.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_logged_in_users_can_query_drafts() {
		$draft_id = $this->create_post(
			array(
				'post_status' => 'draft',
				'post_title'  => 'Draft Post',
			)
		);

		WPCOM_JSON_API::init()->query = array(
			'status'  => 'draft',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertGreaterThanOrEqual( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertContains( $draft_id, $found_ids );
	}

	/**
	 * Test filtering by category.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_category() {
		$cat    = wp_insert_term( 'test-cat', 'category' );
		$cat_id = $cat['term_id'];

		$post_in_cat = $this->create_post( array( 'post_title' => 'In Category' ) );
		wp_set_post_categories( $post_in_cat, array( $cat_id ) );

		$this->create_post( array( 'post_title' => 'Not In Category' ) );

		WPCOM_JSON_API::init()->query = array(
			'category' => 'test-cat',
			'context'  => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_in_cat ), $found_ids );
	}

	/**
	 * Test filtering by tag.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_tag() {
		$post_id = $this->create_post( array( 'post_title' => 'Tagged Post' ) );
		wp_set_post_tags( $post_id, array( 'special-tag' ) );

		$this->create_post( array( 'post_title' => 'Untagged Post' ) );

		WPCOM_JSON_API::init()->query = array(
			'tag'     => 'special-tag',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );
	}

	/**
	 * Test filtering by author.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_author() {
		$post_id = $this->create_post(
			array(
				'post_title'  => 'Admin Post',
				'post_author' => self::$admin_user_id,
			)
		);

		$this->create_post(
			array(
				'post_title'  => 'Author Post',
				'post_author' => self::$author_user_id,
			)
		);

		WPCOM_JSON_API::init()->query = array(
			'author'  => self::$admin_user_id,
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );
	}

	/**
	 * Test filtering by search query.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_search() {
		$post_id = $this->create_post(
			array(
				'post_title'   => 'UniqueSearchTerm12345',
				'post_content' => 'Some content.',
			)
		);

		$this->create_post(
			array(
				'post_title'   => 'UniqueSearchTerm54321',
				'post_content' => 'Some content.',
			)
		);

		WPCOM_JSON_API::init()->query = array(
			'search'  => 'UniqueSearchTerm12345',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );
	}

	/**
	 * Test excluding specific post IDs.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_exclude_post_ids() {
		$post_1 = $this->create_post( array( 'post_title' => 'Keep Post' ) );
		$post_2 = $this->create_post( array( 'post_title' => 'Exclude Post' ) );

		WPCOM_JSON_API::init()->query = array(
			'exclude' => array( $post_2 ),
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertContains( $post_1, $found_ids );
		$this->assertNotContains( $post_2, $found_ids );
	}

	/**
	 * Test including specific post IDs.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_include_post_ids() {
		$post_1 = $this->create_post( array( 'post_title' => 'Include Post' ) );
		$this->create_post( array( 'post_title' => 'Other Post' ) );

		WPCOM_JSON_API::init()->query = array(
			'include' => array( $post_1 ),
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_1 ), $found_ids );
	}

	/**
	 * Test ordering posts by title ascending.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_order_by_title_asc() {
		$post_a = $this->create_post( array( 'post_title' => 'AAA First' ) );
		$post_z = $this->create_post( array( 'post_title' => 'ZZZ Last' ) );

		WPCOM_JSON_API::init()->query = array(
			'order_by' => 'title',
			'order'    => 'ASC',
			'include'  => array( $post_a, $post_z ),
			'context'  => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertCount( 2, $response['posts'] );
		$this->assertSame( $post_a, $response['posts'][0]['ID'] );
		$this->assertSame( $post_z, $response['posts'][1]['ID'] );
	}

	/**
	 * Test pagination with page parameter.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_pagination_with_page() {
		// Create 3 posts.
		$this->create_post( array( 'post_title' => 'Page Post 1' ) );
		$this->create_post( array( 'post_title' => 'Page Post 2' ) );
		$this->create_post( array( 'post_title' => 'Page Post 3' ) );

		$endpoint = $this->get_endpoint();

		// Page 1 with 2 per page.
		WPCOM_JSON_API::init()->query = array(
			'number'  => 2,
			'page'    => 1,
			'context' => 'display',
		);

		$page1 = $endpoint->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $page1 );
		$this->assertCount( 2, $page1['posts'] );

		// Page 2.
		WPCOM_JSON_API::init()->query = array(
			'number'  => 2,
			'page'    => 2,
			'context' => 'display',
		);

		$page2 = $endpoint->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $page2 );
		$this->assertGreaterThanOrEqual( 1, count( $page2['posts'] ) );

		// Pages should have different posts.
		$page1_ids = wp_list_pluck( $page1['posts'], 'ID' );
		$page2_ids = wp_list_pluck( $page2['posts'], 'ID' );
		$this->assertEmpty( array_intersect( $page1_ids, $page2_ids ) );
	}

	/**
	 * Test pagination with offset parameter.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_pagination_with_offset() {
		$this->create_post( array( 'post_title' => 'Offset Post 1' ) );
		$this->create_post( array( 'post_title' => 'Offset Post 2' ) );
		$this->create_post( array( 'post_title' => 'Offset Post 3' ) );

		$endpoint = $this->get_endpoint();

		// Get all posts.
		WPCOM_JSON_API::init()->query = array(
			'number'  => 20,
			'context' => 'display',
		);

		$all_response = $endpoint->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		// Get with offset of 1.
		WPCOM_JSON_API::init()->query = array(
			'number'  => 20,
			'offset'  => 1,
			'context' => 'display',
		);

		$offset_response = $endpoint->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $offset_response );
		$this->assertCount( count( $all_response['posts'] ) - 1, $offset_response['posts'] );
	}

	/**
	 * Test that empty results return correct structure.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_empty_results_structure() {
		WPCOM_JSON_API::init()->query = array(
			'search'  => 'absolutely_no_posts_match_this_query_string_xyzzy',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 0, $response['found'] );
		$this->assertEmpty( $response['posts'] );
	}

	/**
	 * Test the handle_date_range method with 'before' date.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_handle_date_range_before() {
		$endpoint             = $this->get_endpoint();
		$endpoint->date_range = array( 'before' => '2025-01-01T00:00:00' );

		$result = $endpoint->handle_date_range( 'WHERE 1=1' );

		$this->assertStringContainsString( 'post_date', $result );
		$this->assertStringContainsString( '<=', $result );
		$this->assertStringContainsString( '2025-01-01', $result );
	}

	/**
	 * Test the handle_date_range method with 'after' date.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_handle_date_range_after() {
		$endpoint             = $this->get_endpoint();
		$endpoint->date_range = array( 'after' => '2025-01-01T00:00:00' );

		$result = $endpoint->handle_date_range( 'WHERE 1=1' );

		$this->assertStringContainsString( 'post_date', $result );
		$this->assertStringContainsString( '>=', $result );
		$this->assertStringContainsString( '2025-01-01', $result );
	}

	/**
	 * Test the handle_date_range method with both 'before' and 'after'.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_handle_date_range_between() {
		$endpoint             = $this->get_endpoint();
		$endpoint->date_range = array(
			'after'  => '2025-01-01T00:00:00',
			'before' => '2025-12-31T23:59:59',
		);

		$result = $endpoint->handle_date_range( 'WHERE 1=1' );

		$this->assertStringContainsString( 'BETWEEN', $result );
		$this->assertStringContainsString( '2025-01-01', $result );
		$this->assertStringContainsString( '2025-12-31', $result );

		$endpoint->date_range = array();
	}

	/**
	 * Test that sticky posts are handled correctly when sticky=true.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_sticky_posts_filter_true() {
		$sticky_post = $this->create_post( array( 'post_title' => 'Sticky Post' ) );
		stick_post( $sticky_post );

		$this->create_post( array( 'post_title' => 'Non-Sticky Post' ) );

		WPCOM_JSON_API::init()->query = array(
			'sticky'  => true,
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertContains( $sticky_post, $found_ids );
	}

	/**
	 * Test that page post type can be queried.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_query_pages() {
		$page_id = $this->create_post(
			array(
				'post_title' => 'Test Page',
				'post_type'  => 'page',
			)
		);

		WPCOM_JSON_API::init()->query = array(
			'type'    => 'page',
			'context' => 'display',
		);

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertGreaterThanOrEqual( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $page_id ), $found_ids );
	}

	/**
	 * Test that logged-out users cannot see password-protected posts.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_logged_out_cannot_see_password_protected_posts() {
		$post_id = $this->create_post( array( 'post_title' => 'Test Post' ) );

		$this->create_post(
			array(
				'post_title'    => 'Protected Post',
				'post_password' => 'secret',
			)
		);

		wp_set_current_user( 0 );

		WPCOM_JSON_API::init()->query = array( 'context' => 'display' );

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );
	}

	/**
	 * Test that context=edit returns posts for users with edit capability.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_context_edit_for_admin() {
		$post_content = '<strong>Content for edit context test.</strong>';

		$post_id = $this->create_post(
			array(
				'post_title'   => 'Edit Context Post',
				'post_content' => $post_content,
			)
		);

		WPCOM_JSON_API::init()->query = array( 'context' => 'edit' );
		$response                     = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		WPCOM_JSON_API::init()->query = array( 'context' => 'display' );
		$response_display             = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 1, $response['found'] );

		$found_ids = wp_list_pluck( $response['posts'], 'ID' );
		$this->assertEquals( array( $post_id ), $found_ids );

		$this->assertEquals( htmlentities( $post_content, ENT_QUOTES | ENT_SUBSTITUTE | ENT_HTML401 ), $response['posts'][0]['content'] );
		$this->assertStringContainsString( $post_content, $response_display['posts'][0]['content'] );
	}

	/**
	 * Test that context=edit is denied for users without edit capability.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_context_edit_denied_for_subscriber() {
		$this->create_post( array( 'post_title' => 'Edit Context Post' ) );

		wp_set_current_user( self::$subscriber_user_id );

		WPCOM_JSON_API::init()->query = array( 'context' => 'edit' );

		$response = $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/posts/', self::$blog_id );

		$this->assertIsArray( $response );
		$this->assertSame( 0, $response['found'] );
	}
}
