<?php
/**
 * WPCOM_JSON_API_List_Users_Endpoint unit tests.
 *
 * Run this test with command: jetpack docker phpunit jetpack -- --filter=WPCOM_JSON_API_List_Users_Endpoint_Test
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';
require_once JETPACK__PLUGIN_DIR . 'json-endpoints/class.wpcom-json-api-list-users-endpoint.php';
require_once __DIR__ . '/trait-assert-rest-xmlrpc-parity.php';

/**
 * Tests for the /sites/%s/users list users endpoint.
 *
 * @covers \WPCOM_JSON_API_List_Users_Endpoint
 */
#[CoversClass( WPCOM_JSON_API_List_Users_Endpoint::class )]
class WPCOM_JSON_API_List_Users_Endpoint_Test extends WP_UnitTestCase {
	use WP_UnitTestCase_Fix;
	use Assert_Rest_Xmlrpc_Parity;

	/**
	 * An administrator user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * An editor user ID.
	 *
	 * @var int
	 */
	private static $editor_user_id;

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

	/**
	 * Saved $_SERVER values restored in tear_down.
	 *
	 * @var array
	 */
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
		self::$editor_user_id     = $factory->user->create( array( 'role' => 'editor' ) );
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
	 * Retrieve the registered endpoint instance.
	 *
	 * The endpoint file registers itself via a top-level `new` call when required, so we look it
	 * up from the API's registered endpoints. There is a single list-users registration today, but
	 * each version is stored as its own entry; should a future version be added we want the latest,
	 * so we return the class match with the highest max_version -- the one supports_rest()/production
	 * REST routes to -- rather than whichever happens to be iterated first.
	 *
	 * @return WPCOM_JSON_API_List_Users_Endpoint
	 *
	 * @phan-suppress PhanTypeArraySuspicious
	 */
	private function get_endpoint() {
		$api    = WPCOM_JSON_API::init();
		$latest = null;
		foreach ( $api->endpoints as $endpoints_by_method ) {
			$endpoint = $endpoints_by_method['GET'] ?? null;
			if (
				$endpoint instanceof WPCOM_JSON_API_List_Users_Endpoint
				&& ( null === $latest || version_compare( (string) $endpoint->max_version, (string) $latest->max_version, '>' ) )
			) {
				$latest = $endpoint;
			}
		}
		if ( null === $latest ) {
			$this->fail( 'WPCOM_JSON_API_List_Users_Endpoint not found in registered endpoints.' );
		}
		return $latest;
	}

	/**
	 * Invoke the endpoint's callback() with the given query params.
	 *
	 * @param array $query Request params placed on the shared API query.
	 * @return array|WP_Error Decoded callback() return.
	 */
	private function call( array $query = array() ) {
		WPCOM_JSON_API::init()->query = $query;
		return $this->get_endpoint()->callback( '/sites/' . self::$blog_id . '/users/', self::$blog_id );
	}

	/**
	 * The default response carries an int `found`, an array of users, and each user object
	 * exposes the documented author fields. Because the list endpoint requests email + IP,
	 * those come back as strings here (they are `false` in the post-author shape).
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_returns_users_default_shape() {
		$response = $this->call();

		$this->assertIsArray( $response );
		$this->assertIsInt( $response['found'] );
		$this->assertIsArray( $response['users'] );
		$this->assertNotEmpty( $response['users'] );

		// callback() returns each user as a stdClass; cast for field-key inspection.
		$by_id = array();
		foreach ( $response['users'] as $user ) {
			$by_id[ (int) $user->ID ] = (array) $user;
		}
		$this->assertArrayHasKey( self::$admin_user_id, $by_id, 'Admin user is listed.' );

		$admin = $by_id[ self::$admin_user_id ];
		foreach ( array( 'ID', 'login', 'email', 'name', 'first_name', 'last_name', 'nice_name', 'URL', 'avatar_URL', 'profile_URL', 'ip_address', 'roles' ) as $field ) {
			$this->assertArrayHasKey( $field, $admin, "User object exposes the {$field} field." );
		}

		$this->assertIsString( $admin['email'], 'List endpoint exposes email as a string.' );
		$this->assertIsString( $admin['ip_address'], 'List endpoint exposes ip_address as a string.' );
	}

	/**
	 * Each user object is enriched with its roles array.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_roles_are_populated() {
		$response = $this->call();

		$roles_by_id = array();
		foreach ( $response['users'] as $user ) {
			$roles_by_id[ (int) $user->ID ] = $user->roles;
		}

		$this->assertContains( 'administrator', $roles_by_id[ self::$admin_user_id ] );
		$this->assertContains( 'author', $roles_by_id[ self::$author_user_id ] );
	}

	/**
	 * `number` caps the returned users while `found` reports the true total.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_number_limits_results_but_not_found() {
		$prefix = 'numusr_' . wp_generate_password( 6, false );
		for ( $i = 0; $i < 3; $i++ ) {
			self::factory()->user->create(
				array(
					'role'       => 'author',
					'user_login' => $prefix . $i,
				)
			);
		}

		$response = $this->call(
			array(
				'number' => 2,
				'search' => '*' . $prefix . '*',
			)
		);

		$this->assertIsArray( $response );
		$this->assertCount( 2, $response['users'] );
		$this->assertSame( 3, $response['found'] );
	}

	/**
	 * `number` above the 1000 hard cap is rejected.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_number_over_1000_returns_error() {
		$response = $this->call( array( 'number' => 1001 ) );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'invalid_number', $response->get_error_code() );
		$this->assertSame( 400, $response->get_error_data() );
	}

	/**
	 * `offset` skips the first N matches.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_offset_paginates() {
		$prefix = 'offusr_' . wp_generate_password( 6, false );
		for ( $i = 0; $i < 3; $i++ ) {
			self::factory()->user->create(
				array(
					'role'       => 'author',
					'user_login' => $prefix . $i,
				)
			);
		}

		$all = $this->call( array( 'search' => '*' . $prefix . '*' ) );
		$this->assertCount( 3, $all['users'] );

		$offset = $this->call(
			array(
				'search' => '*' . $prefix . '*',
				'offset' => 1,
			)
		);
		$this->assertCount( 2, $offset['users'] );
	}

	/**
	 * `order_by=login` honors the sort direction.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_order_by_login_respects_direction() {
		$suffix = '_ordusr_' . wp_generate_password( 6, false );
		$first  = self::factory()->user->create(
			array(
				'role'       => 'author',
				'user_login' => 'aaa' . $suffix,
			)
		);
		$last   = self::factory()->user->create(
			array(
				'role'       => 'author',
				'user_login' => 'zzz' . $suffix,
			)
		);

		$asc     = $this->call(
			array(
				'search'   => '*' . $suffix . '*',
				'order_by' => 'login',
				'order'    => 'ASC',
			)
		);
		$asc_ids = wp_list_pluck( $asc['users'], 'ID' );
		$this->assertSame( array( $first, $last ), $asc_ids );

		$desc     = $this->call(
			array(
				'search'   => '*' . $suffix . '*',
				'order_by' => 'login',
				'order'    => 'DESC',
			)
		);
		$desc_ids = wp_list_pluck( $desc['users'], 'ID' );
		$this->assertSame( array( $last, $first ), $desc_ids );
	}

	/**
	 * `search` matches against the default columns (here, the login).
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_search_matches_user() {
		$login   = 'searchusr_' . wp_generate_password( 6, false );
		$user_id = self::factory()->user->create(
			array(
				'role'       => 'author',
				'user_login' => $login,
			)
		);

		$response = $this->call( array( 'search' => '*' . $login . '*' ) );

		$this->assertSame( 1, $response['found'] );
		$this->assertSame( array( $user_id ), wp_list_pluck( $response['users'], 'ID' ) );
	}

	/**
	 * `search_columns` restricts which columns `search` looks at, via the
	 * user_search_columns override the endpoint installs.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_search_columns_restrict_the_match() {
		$token   = 'coltoken' . wp_generate_password( 6, false );
		$user_id = self::factory()->user->create(
			array(
				'role'         => 'author',
				'user_login'   => 'plainlogin_' . wp_generate_password( 6, false ),
				'display_name' => $token,
			)
		);

		// Matches when we search the display_name column.
		$matched = $this->call(
			array(
				'search'         => '*' . $token . '*',
				'search_columns' => array( 'display_name' ),
			)
		);
		$this->assertSame( array( $user_id ), wp_list_pluck( $matched['users'], 'ID' ) );

		// Misses when we only search the login column (the token lives in display_name).
		$missed = $this->call(
			array(
				'search'         => '*' . $token . '*',
				'search_columns' => array( 'user_login' ),
			)
		);
		$this->assertNotContains( $user_id, wp_list_pluck( $missed['users'], 'ID' ) );
	}

	/**
	 * `role` returns only users in that role.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_role() {
		$response = $this->call( array( 'role' => 'author' ) );

		$ids = wp_list_pluck( $response['users'], 'ID' );
		$this->assertContains( self::$author_user_id, $ids );
		$this->assertNotContains( self::$admin_user_id, $ids );
		$this->assertNotContains( self::$subscriber_user_id, $ids );
	}

	/**
	 * `capability` returns only users holding that capability.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_filter_by_capability() {
		$response = $this->call( array( 'capability' => 'manage_options' ) );

		$ids = wp_list_pluck( $response['users'], 'ID' );
		$this->assertContains( self::$admin_user_id, $ids );
		$this->assertNotContains( self::$subscriber_user_id, $ids );
	}

	/**
	 * `authors_only` limits results to users who can edit posts; subscribers are excluded.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_authors_only_excludes_non_authors() {
		$response = $this->call( array( 'authors_only' => true ) );

		$this->assertIsArray( $response );
		$ids = wp_list_pluck( $response['users'], 'ID' );
		$this->assertContains( self::$author_user_id, $ids );
		$this->assertContains( self::$editor_user_id, $ids );
		$this->assertNotContains( self::$subscriber_user_id, $ids );
	}

	/**
	 * `authors_only` with an unknown post type is rejected.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_authors_only_unknown_post_type_returns_error() {
		$response = $this->call(
			array(
				'authors_only' => true,
				'type'         => 'nonexistent_type_xyzzy',
			)
		);

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'unknown_post_type', $response->get_error_code() );
		$this->assertSame( 404, $response->get_error_data() );
	}

	/**
	 * `authors_only` is denied for a user who cannot edit others' posts.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_authors_only_unauthorized_returns_403() {
		wp_set_current_user( self::$subscriber_user_id );

		$response = $this->call( array( 'authors_only' => true ) );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );
	}

	/**
	 * The default (non-authors_only) listing requires the list_users capability.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_list_users_unauthorized_returns_403() {
		wp_set_current_user( self::$subscriber_user_id );

		$response = $this->call();

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertSame( 'unauthorized', $response->get_error_code() );
		$this->assertSame( 403, $response->get_error_data() );
	}

	/**
	 * REST-vs-XML-RPC parity carrying real query params (role + number). The bare-default
	 * parity for /users is already covered generically by WPCOM_JSON_API_Rest_Parity_Coverage_Test;
	 * this case locks param pass-through through the REST route, so a route that silently dropped
	 * `role` or `number` would diverge here.
	 *
	 * @group json-api
	 */
	#[Group( 'json-api' )]
	public function test_rest_xmlrpc_parity_with_params() {
		self::factory()->user->create(
			array(
				'role'       => 'author',
				'user_login' => 'parityusr_' . wp_generate_password( 6, false ),
			)
		);

		list( $xmlrpc, $rest ) = $this->assert_rest_parity(
			$this->get_endpoint(),
			array(
				'role'   => 'author',
				'number' => 10,
			)
		);

		$this->assertNotEmpty( $rest['users'] );
		$this->assertSame( $xmlrpc['found'], $rest['found'] );
		$this->assertSame(
			wp_list_pluck( $xmlrpc['users'], 'ID' ),
			wp_list_pluck( $rest['users'], 'ID' )
		);
	}
}
