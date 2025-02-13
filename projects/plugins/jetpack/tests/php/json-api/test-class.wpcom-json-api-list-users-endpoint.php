<?php
/**
 * Jetpack WPCOM JSON API `sites/%s/users` endpoint unit tests.
 * Run this test with command: jetpack docker phpunit -- --filter=WP_Test_WPCOM_JSON_API_List_Users_Endpoint
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Jetpack `sites/%s/users` endpoint unit tests.
 */
class WP_Test_WPCOM_JSON_API_List_Users_Endpoint extends WP_UnitTestCase {
	/**
	 * Mock user ID with administrator permissions.
	 *
	 * @var int
	 */
	private static $user_admin_id = 0;

	/**
	 * Mock user ID with editor permissions.
	 *
	 * @var int
	 */
	private static $user_editor_id = 0;

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		parent::set_up();
		static::$user_admin_id  = self::factory()->user->create( array( 'role' => 'administrator' ) );
		static::$user_editor_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( static::$user_admin_id );
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		wp_delete_user( static::$user_admin_id );
		wp_delete_user( static::$user_editor_id );

		parent::tear_down();
	}

	/**
	 * Returns the response of a successful GET request to `sites/%s/users`.
	 */
	public function make_get_request( $query_args = array() ) {
		global $blog_id;

		$endpoint = new WPCOM_JSON_API_List_Users_Endpoint(
			array(
				'description'          => 'List the users of a site.',
				'group'                => 'users',
				'stat'                 => 'users:list',
				'method'               => 'GET',
				'path'                 => '/sites/%s/users',
				'path_labels'          => array(
					'$site' => '(int|string) Site ID or domain',
				),
				'query_parameters'     => array(
					'number'          => '(int=20) Limit the total number of authors returned.',
					'offset'          => '(int=0) The first n authors to be skipped in the returned array.',
					'order'           => array(
						'DESC' => 'Return authors in descending order.',
						'ASC'  => 'Return authors in ascending order.',
					),
					'order_by'        => array(
						'ID'           => 'Order by ID (default).',
						'login'        => 'Order by username.',
						'nicename'     => 'Order by nicename.',
						'email'        => 'Order by author email address.',
						'url'          => 'Order by author URL.',
						'registered'   => 'Order by registered date.',
						'display_name' => 'Order by display name.',
						'post_count'   => 'Order by number of posts published.',
					),
					'authors_only'    => '(bool) Set to true to fetch authors only',
					'include_viewers' => '(bool) Set to true to include viewers for Simple sites. When you pass in this parameter, order, order_by and search_columns are ignored. Currently, `search` is limited to the first page of results.',
					'type'            => "(string) Specify the post type to query authors for. Only works when combined with the `authors_only` flag. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
					'search'          => '(string) Find matching users.',
					'search_columns'  => "(array) Specify which columns to check for matching users. Can be any of 'ID', 'user_login', 'user_email', 'user_url', 'user_nicename', and 'display_name'. Only works when combined with `search` parameter.",
					'role'            => '(string) Specify a specific user role to fetch.',
					'capability'      => '(string) Specify a specific capability to fetch. You can specify multiple by comma separating them, in which case the user needs to match all capabilities provided.',
				),
				'response_format'      => array(
					'found'   => '(int) The total number of authors found that match the request (ignoring limits and offsets).',
					'authors' => '(array:author) Array of author objects.',
				),
				'example_response'     => '{
				"found": 1,
				"users": [
					{
						"ID": 78972699,
						"login": "apiexamples",
						"email": "justin+apiexamples@a8c.com",
						"name": "apiexamples",
						"first_name": "",
						"last_name": "",
						"nice_name": "apiexamples",
						"URL": "http://apiexamples.wordpress.com",
						"avatar_URL": "https://1.gravatar.com/avatar/a2afb7b6c0e23e5d363d8612fb1bd5ad?s=96&d=identicon&r=G",
						"profile_URL": "https://gravatar.com/apiexamples",
						"site_ID": 82974409,
						"roles": [
							"administrator"
						],
						"is_super_admin": false
					}
				]
			}',
				'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/users',
				'example_request_data' => array(
					'headers' => array(
						'authorization' => 'Bearer YOUR_API_TOKEN',
					),
				),
			)
		);

		$endpoint->api->query = $query_args;

		return $endpoint->callback( '/sites/%s/users', $blog_id );
	}

	/**
	 * Test GET `sites/%s/users` returns correct users.
	 */
	public function test_get_users_returns_correct_users() {
		$response = $this->make_get_request();
		$users    = $response['users'];

		// Find admin user.
		$admin_user = array_filter(
			$users,
			function ( $user ) {
				return static::$user_admin_id === $user->ID;
			}
		);
		$admin_user = reset( $admin_user );

		// Find editor user.
		$editor_user = array_filter(
			$users,
			function ( $user ) {
				return static::$user_editor_id === $user->ID;
			}
		);
		$editor_user = reset( $editor_user );

		// Assert user IDs and roles.
		$this->assertNotNull( $admin_user, 'Admin user not found' );
		$this->assertEquals( static::$user_admin_id, $admin_user->ID, 'Admin user ID is not correct' );
		$this->assertContains( 'administrator', $admin_user->roles, 'Admin user roles are not correct' );

		$this->assertNotNull( $editor_user, 'Editor user not found' );
		$this->assertEquals( static::$user_editor_id, $editor_user->ID, 'Editor user ID is not correct' );
		$this->assertContains( 'editor', $editor_user->roles, 'Editor user roles are not correct' );
	}
}
