<?php
/**
 * WPCOM_JSON_API_List_Comments_Endpoint unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_List_Comments_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Tests for the `found` total of the list comments endpoints.
 *
 * @covers \WPCOM_JSON_API_List_Comments_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_List_Comments_Endpoint::class )]
class WPCOM_JSON_API_List_Comments_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;

	/**
	 * An administrator user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * The post holding the comment fixtures.
	 *
	 * @var int
	 */
	private static $post_id;

	/**
	 * A top-level comment that has a reply.
	 *
	 * @var int
	 */
	private static $parent_comment_id;

	/**
	 * The current blog ID.
	 *
	 * @var int
	 */
	private static $blog_id;

	/**
	 * Saved $_SERVER values restored in tear_down.
	 *
	 * @var array
	 */
	private $pre_globals;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * Approved on the post: 3 top-level comments, 1 reply, 2 pingbacks, 1 trackback,
	 * and 4 Fediverse reactions (2 likes, 1 repost, 1 quote).
	 * Also 1 comment in moderation, and 1 approved comment plus 1 like on another post.
	 *
	 * @param WP_UnitTest_Factory $factory A factory object.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$post_id       = $factory->post->create();
		self::$blog_id       = $GLOBALS['blog_id'];

		$approved = array(
			'comment_post_ID'  => self::$post_id,
			'comment_approved' => 1,
		);

		self::$parent_comment_id = $factory->comment->create( $approved + array( 'comment_date_gmt' => '2026-01-01 10:00:00' ) );
		$factory->comment->create( $approved + array( 'comment_date_gmt' => '2026-02-01 10:00:00' ) );
		$factory->comment->create( $approved + array( 'comment_date_gmt' => '2026-03-01 10:00:00' ) );
		$factory->comment->create(
			$approved + array(
				'comment_parent'   => self::$parent_comment_id,
				'comment_date_gmt' => '2026-03-02 10:00:00',
			)
		);
		$factory->comment->create_many( 2, $approved + array( 'comment_type' => 'pingback' ) );
		$factory->comment->create( $approved + array( 'comment_type' => 'trackback' ) );
		$factory->comment->create_many( 2, $approved + array( 'comment_type' => 'like' ) );
		$factory->comment->create( $approved + array( 'comment_type' => 'repost' ) );
		$factory->comment->create( $approved + array( 'comment_type' => 'quote' ) );
		$factory->comment->create(
			array(
				'comment_post_ID'  => self::$post_id,
				'comment_approved' => 0,
			)
		);
		$other_post_id = $factory->post->create();
		$factory->comment->create(
			array(
				'comment_post_ID'  => $other_post_id,
				'comment_approved' => 1,
			)
		);
		$factory->comment->create(
			array(
				'comment_post_ID'  => $other_post_id,
				'comment_approved' => 1,
				'comment_type'     => 'like',
			)
		);
	}

	/**
	 * Prepare the environment for each test.
	 */
	public function set_up() {
		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->pre_globals         = $_SERVER;
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => self::$blog_id );
		wp_set_current_user( self::$admin_user_id );

		// The ActivityPub plugin registers its reaction types with the API the same way.
		$add_reaction_types = static function ( $types ) {
			return array_merge( $types, array( 'like', 'repost', 'quote' ) );
		};
		add_filter( 'jetpack_json_api_comment_types', $add_reaction_types );
		add_filter( 'jetpack_api_include_comment_types_count', $add_reaction_types );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		parent::tear_down();

		$_SERVER = $this->pre_globals;

		WPCOM_JSON_API::init()->token_details = array();
		WPCOM_JSON_API::init()->query         = array();
		wp_set_current_user( 0 );
	}

	/**
	 * Retrieve the registered GET endpoint for a path template.
	 *
	 * @param string $path Registered path, e.g. `/sites/%s/posts/%d/replies/`.
	 * @return WPCOM_JSON_API_List_Comments_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint( $path ) {
		foreach ( WPCOM_JSON_API::init()->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['GET'] ?? null;
			if ( $endpoint instanceof WPCOM_JSON_API_List_Comments_Endpoint && $path === $endpoint->path ) {
				return $endpoint;
			}
		}
		$this->fail( "No list comments endpoint registered for {$path}." );
	}

	/**
	 * Request a post's comments.
	 *
	 * @param array $query Request params.
	 * @return array|WP_Error
	 */
	private function get_post_replies( array $query ) {
		WPCOM_JSON_API::init()->query = $query;
		return $this->get_endpoint( '/sites/%s/posts/%d/replies/' )->callback(
			sprintf( '/sites/%d/posts/%d/replies/', self::$blog_id, self::$post_id ),
			self::$blog_id,
			self::$post_id
		);
	}

	/**
	 * Request the site's comments.
	 *
	 * @param array $query Request params.
	 * @return array|WP_Error
	 */
	private function get_site_comments( array $query ) {
		WPCOM_JSON_API::init()->query = $query;
		return $this->get_endpoint( '/sites/%s/comments/' )->callback(
			sprintf( '/sites/%d/comments/', self::$blog_id ),
			self::$blog_id
		);
	}

	/**
	 * The distinct comment types in a response.
	 *
	 * @param array $response Endpoint response.
	 * @return string[]
	 */
	private static function response_types( array $response ) {
		$types = array_unique( array_column( $response['comments'], 'type' ) );
		sort( $types );
		return $types;
	}

	/**
	 * Typed requests on a post count only that type, replies included, ignoring pagination.
	 *
	 * @dataProvider provide_typed_totals
	 * @group json-api
	 *
	 * @param array $query    Request params.
	 * @param int   $expected Expected `found`.
	 */
	#[Group( 'json-api' )]
	#[DataProvider( 'provide_typed_totals' )]
	public function test_typed_post_request_returns_total( array $query, $expected ) {
		$response = $this->get_post_replies( $query );

		$this->assertIsArray( $response );
		$this->assertSame( $expected, $response['found'] );
	}

	/**
	 * Data provider for test_typed_post_request_returns_total.
	 *
	 * @return array
	 */
	public static function provide_typed_totals() {
		return array(
			'comments with replies, no pings' => array( array( 'type' => 'comment' ), 4 ),
			'second page keeps the total'     => array(
				array(
					'type'   => 'comment',
					'number' => 2,
					'page'   => 2,
				),
				4,
			),
			'pingbacks'                       => array( array( 'type' => 'pingback' ), 2 ),
			'likes'                           => array( array( 'type' => 'like' ), 2 ),
			'unapproved comments'             => array(
				array(
					'type'   => 'comment',
					'status' => 'unapproved',
				),
				1,
			),
			'comments after a date'           => array(
				array(
					'type'  => 'comment',
					'after' => '2026-02-15T00:00:00+00:00',
				),
				2,
			),
			'hierarchical comments'           => array(
				array(
					'type'         => 'comment',
					'hierarchical' => 'true',
				),
				4,
			),
		);
	}

	/**
	 * A type=any post request keeps the wp_count_comments() total without a count query.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_any_type_post_request_counts_every_type() {
		$count_queries = 0;
		add_action(
			'pre_get_comments',
			static function ( $comment_query ) use ( &$count_queries ) {
				// Only the endpoint's own queries exclude types; core's get_comment_count() also runs counts.
				if ( $comment_query->query_vars['count'] && $comment_query->query_vars['type__not_in'] ) {
					++$count_queries;
				}
			}
		);

		$response = $this->get_post_replies( array( 'type' => 'any' ) );

		$this->assertSame( 11, $response['found'] );
		$this->assertCount( 11, $response['comments'] );
		$this->assertSame( array( 'comment', 'like', 'pingback', 'quote', 'repost', 'trackback' ), self::response_types( $response ) );
		$this->assertSame( 0, $count_queries );
	}

	/**
	 * An untyped post request leaves out Fediverse reactions and counts without them.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_untyped_post_request_hides_reactions() {
		$response = $this->get_post_replies( array() );

		$this->assertSame( 7, $response['found'] );
		$this->assertCount( 7, $response['comments'] );
		$this->assertSame( array( 'comment', 'pingback', 'trackback' ), self::response_types( $response ) );
	}

	/**
	 * An untyped site request leaves out Fediverse reactions and counts without them.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_untyped_site_request_hides_reactions() {
		$response = $this->get_site_comments( array() );

		$this->assertSame( 8, $response['found'] );
		$this->assertCount( 8, $response['comments'] );
		$this->assertSame( array( 'comment', 'pingback', 'trackback' ), self::response_types( $response ) );
	}

	/**
	 * A type=any site request returns Fediverse reactions and counts them.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_any_type_site_request_returns_reactions() {
		$response = $this->get_site_comments( array( 'type' => 'any' ) );

		$this->assertSame( 13, $response['found'] );
		$this->assertCount( 13, $response['comments'] );
		$this->assertSame( array( 'comment', 'like', 'pingback', 'quote', 'repost', 'trackback' ), self::response_types( $response ) );
	}

	/**
	 * Typed site-wide requests still report an unknown total.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_typed_site_request_keeps_unknown_total() {
		$response = $this->get_site_comments( array( 'type' => 'comment' ) );

		$this->assertIsArray( $response );
		$this->assertSame( -1, $response['found'] );
	}
}
