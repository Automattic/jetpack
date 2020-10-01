<?php

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/module-extras.php';
}

require_jetpack_file( 'class.json-api-endpoints.php' );

class WP_Test_Jetpack_Json_Api_Endpoints extends WP_UnitTestCase {
	/**
	 * An admin user_id.
	 *
	 * @var number $admin_user_id.
	 */
	private static $admin_user_id;
	/**
	 * The user_id of a user without read capabilities.
	 *
	 * @var number $no_read_user_id.
	 */
	private static $no_read_user_id;

	/**
	 * Create fixtures once, before any tests in the class have run.
	 *
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_user_id   = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$no_read_user_id = $factory->user->create();

		$no_read_user = get_user_by( 'id', self::$no_read_user_id );
		$no_read_user->add_cap( 'read', false );
	}

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	public function setUp() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::setUp();

		$this->set_globals();

		// Initialize some missing stuff for the API.
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Tests allows_site_based_authentication method.
	 *
	 * @author fgiannar
	 * @covers WPCOM_JSON_API_Endpoint allows_site_based_authentication
	 * @group json-api
	 * @dataProvider data_provider_test_allows_site_based_authentication
	 *
	 * @param bool $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool $is_user_logged_in If a user is logged in.
	 * @param bool $result The expected result.
	 */
	public function test_allows_site_based_authentication( $allow_jetpack_site_auth, $is_user_logged_in, $result ) {

		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( $is_user_logged_in ) {
			wp_set_current_user( self::$admin_user_id );
		}

		$this->assertEquals( $result, $endpoint->allows_site_based_authentication() );
	}

	/**
	 * Tests api accessibility on a private site.
	 *
	 * @author fgiannar
	 * @covers WPCOM_JSON_API switch_to_blog_and_validate_user
	 * @group json-api
	 * @dataProvider data_provider_test_private_site_accessibility
	 *
	 * @param bool            $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool            $use_blog_token If we should simulate a blog token for this test.
	 * @param bool            $user_can_read If the current user has read capability. When a blog token is used this has no effect.
	 * @param WP_Error|string $result The expected result.
	 */
	public function test_private_site_accessibility( $allow_jetpack_site_auth, $use_blog_token, $user_can_read, $result ) {
		// Private site.
		update_option( 'blog_public', '-1' );

		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( ! $use_blog_token ) {
			$user_id = $user_can_read ? self::$admin_user_id : self::$no_read_user_id;
			wp_set_current_user( $user_id );
		}
		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	/**
	 * Tests endpoint capabilities.
	 *
	 * @author fgiannar
	 * @covers Jetpack_JSON_API_Endpoint validate_call
	 * @group json-api
	 * @dataProvider data_provider_test_endpoint_capabilities
	 *
	 * @param bool            $allow_jetpack_site_auth The endpoint's `allow_jetpack_site_auth` value.
	 * @param bool            $use_blog_token If we should simulate a blog token for this test.
	 * @param bool            $user_with_permissions If the current user has the needed capabilities to access the endpoint. When a blog token is used this has no effect.
	 * @param WP_Error|string $result The expected result.
	 */
	public function test_endpoint_capabilities( $allow_jetpack_site_auth, $use_blog_token, $user_with_permissions, $result ) {
		$endpoint = new Jetpack_JSON_API_Dummy_Endpoint(
			array(
				'stat'                    => 'dummy',
				'allow_jetpack_site_auth' => $allow_jetpack_site_auth,
			)
		);

		if ( ! $use_blog_token ) {
			$user_id = $user_with_permissions ? self::$admin_user_id : self::$no_read_user_id;
			wp_set_current_user( $user_id );
		}
		$this->assertEquals( $result, $endpoint->api->process_request( $endpoint, array() ) );
	}

	public function create_get_category_endpoint() {
		// From json-endpoints/class.wpcom-json-api-get-taxonomy-endpoint.php :(
		return new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
			'description' => 'Get information about a single category.',
			'group'       => 'taxonomy',
			'stat'        => 'categories:1',

			'method'      => 'GET',
			'path'        => '/sites/%s/categories/slug:%s',
			'path_labels' => array(
				'$site'     => '(int|string) Site ID or domain',
				'$category' => '(string) The category slug'
			),

			'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/slug:community'
		) );
	}

	/**
	 * @author nylen
	 * @covers WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 * @group json-api
	 */
	public function test_get_term_feed_url_pretty_permalinks() {
		global $blog_id;

		$this->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		// Reset taxonomy URL structure after changing permalink structure
		create_initial_taxonomies();

		$category = wp_insert_term( 'test_category', 'category' );

		$endpoint = $this->create_get_category_endpoint();

		$response = $endpoint->callback(
			sprintf( '/sites/%d/categories/slug:test_category', $blog_id ),
			$blog_id,
			'test_category'
		);

		$this->assertStringEndsWith(
			'/category/test_category/feed/',
			$response->feed_url
		);
	}

	/**
	 * @author nylen
	 * @covers WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 * @group json-api
	 */
	public function test_get_term_feed_url_ugly_permalinks() {
		global $blog_id;

		$this->set_permalink_structure( '' );
		// Reset taxonomy URL structure after changing permalink structure
		create_initial_taxonomies();

		$category = wp_insert_term( 'test_category', 'category' );

		$endpoint = $this->create_get_category_endpoint();

		$response = $endpoint->callback(
			sprintf( '/sites/%d/categories/slug:test_category', $blog_id ),
			$blog_id,
			'test_category'
		);

		$this->assertStringEndsWith(
			'/?feed=rss2&amp;cat=' . $category['term_id'],
			$response->feed_url
		);
	}

	/**
	 * Data provider for test_allows_site_based_authentication.
	 */
	public function data_provider_test_allows_site_based_authentication() {
		return array(
			'allow_jetpack_site_auth: true; logged_in_user: false;'  => array( true, false, true ),
			'allow_jetpack_site_auth: false; logged_in_user: false;' => array( false, false, false ),
			'allow_jetpack_site_auth: true; logged_in_user: true;'   => array( true, true, false ),
		);
	}

	/**
	 * Data provider for test_private_site_accessibility.
	 */
	public function data_provider_test_private_site_accessibility() {
		$success = 'success';
		$error   = new WP_Error( 'unauthorized', 'User cannot access this private blog.', 403 );

		return array(
			'allow_jetpack_site_auth: true; blog_token: true; can_read: null'   => array( true, true, null, $success ),
			'allow_jetpack_site_auth: false; blog_token: true; can_read: null'   => array( false, true, null, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; can_read: false'   => array( false, false, false, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; can_read: true'   => array( false, false, true, $success ),
		);
	}

	/**
	 * Data provider for test_endpoint_capabilities.
	 */
	public function data_provider_test_endpoint_capabilities() {
		$success = 'success';
		$error   = new WP_Error( 'unauthorized', 'This user is not authorized to manage_options on this blog.', 403 );

		return array(
			'allow_jetpack_site_auth: true; blog_token: true; user_with_permissions: null'   => array( true, true, null, $success ),
			'allow_jetpack_site_auth: false; blog_token: true; user_with_permissions: null'   => array( false, true, null, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; user_with_permissions: false'   => array( false, false, false, $error ),
			'allow_jetpack_site_auth: false; blog_token: false; user_with_permissions: true'   => array( false, false, true, $success ),
		);
	}
}

/**
 * Dummy endpoint for testing.
 */
class Jetpack_JSON_API_Dummy_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * Only accessible to admins.
	 *
	 * @var array
	 */
	protected $needed_capabilities = 'manage_options';

	/**
	 * Dummy result.
	 */
	public function result() {

		return 'success';
	}
}
