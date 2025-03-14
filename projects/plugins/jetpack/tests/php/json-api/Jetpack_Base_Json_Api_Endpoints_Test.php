<?php
/**
 * Jetpack_JSON_API_Endpoint class unit tests.
 * Run this test with command: jetpack docker phpunit -- --filter=Jetpack_Base_Json_Api_Endpoints_Test
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Generic tests for Jetpack_JSON_API_Endpoint.
 */
class Jetpack_Base_Json_Api_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A super admin user used for test.
	 *
	 * @var int
	 */
	private static $super_admin_user_id;

	/**
	 * Alternative super admin user used for test.
	 *
	 * @var int
	 */
	private static $super_admin_alt_user_id;

	/**
	 * A contributor user used for test.
	 *
	 * @var int
	 */
	private static $contributor_user_id;

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
	 * @param object $factory A factory object needed for creating fixtures.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$super_admin_user_id     = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$super_admin_alt_user_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$contributor_user_id     = $factory->user->create(
			array(
				'user_login'    => 'john_doe',
				'user_pass'     => 'password123',
				'user_nicename' => 'John Doe',
				'user_email'    => 'john.doe@example.com',
				'user_url'      => 'https://example.com',
				'display_name'  => 'John Doe',
				'nickname'      => 'Johnny',
				'first_name'    => 'John',
				'last_name'     => 'Doe',
				'description'   => 'This is a dummy user for testing.',
				'role'          => 'contributor',
			)
		);
	}

	/**
	 * Reset the environment to its original state after the test.
	 */
	public function tear_down() {
		set_error_handler( null );
		delete_user_meta( self::$super_admin_user_id, 'user_id' );

		parent::tear_down();
	}

	/**
	 * @author zaerl
	 * @covers Jetpack_JSON_API_Endpoint::get_author
	 * @group json-api
	 */
	public function test_get_author_should_trigger_error_if_a_user_not_exists() {
		// Force the error handler to return null.
		set_error_handler( '__return_null' );

		$endpoint = $this->get_dummy_endpoint();
		$author   = $endpoint->get_author( 0 );

		$this->assertNull( $author );
	}

	/**
	 * @author zaerl
	 * @covers Jetpack_JSON_API_Endpoint::get_author
	 * @group json-api
	 */
	public function test_get_author_should_return_the_same_user() {
		$endpoint = $this->get_dummy_endpoint();
		$author   = $endpoint->get_author( self::$super_admin_user_id );

		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );
	}

	/**
	 * @author zaerl
	 * @covers Jetpack_JSON_API_Endpoint::get_author
	 * @group json-api
	 */
	public function test_get_author_should_return_the_same_user_if_user_meta_is_set() {
		$endpoint = $this->get_dummy_endpoint();

		// Force a 'user_id' pointing to another user in the user meta.
		add_user_meta( self::$super_admin_user_id, 'user_id', self::$super_admin_alt_user_id );

		$user   = get_user_by( 'id', self::$super_admin_user_id );
		$author = $endpoint->get_author( self::$super_admin_user_id );

		// Check that __get magic method is working.
		$this->assertSame( self::$super_admin_alt_user_id, (int) $user->user_id );

		// The user should be the same as the one passed to the method.
		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );

		$author = $endpoint->get_author( $user );

		// The user should be the same as the one passed as object to the method.
		$this->assertIsObject( $author );
		$this->assertSame( self::$super_admin_user_id, $author->ID );
	}

	/**
	 * @covers Jetpack_JSON_API_Endpoint::get_author
	 * @group json-api
	 */
	public function test_get_author_should_provide_additional_data_when_user_id_is_specified() {
		$endpoint                            = $this->get_dummy_endpoint();
		$commment_data                       = new stdClass();
		$commment_data->comment_author_email = 'foo@bar.foo';
		$commment_data->comment_author       = 'John Doe';
		$commment_data->comment_author_url   = 'https://foo.bar.foo';
		$commment_data->user_id              = static::$contributor_user_id;
		$comment                             = new WP_Comment( $commment_data );

		$author = $endpoint->get_author( $comment, true );

		$this->assertIsObject( $author, 'The returned author should be an object.' );
		$this->assertNotNull( $author, 'The returned author should not be null.' );
		$this->assertSame(
			$commment_data->comment_author_email,
			$author->email,
			'The author email does not match the expected comment author email.'
		);
		$this->assertSame(
			$commment_data->comment_author,
			$author->name,
			'The author name does not match the expected comment author name.'
		);
		$this->assertSame(
			$commment_data->comment_author_url,
			$author->URL, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			'The author URL does not match the expected comment author URL.'
		);

		$user = get_user_by( 'id', static::$contributor_user_id );

		// The user should be the same as the one passed as object to the method.
		$this->assertSame(
			static::$contributor_user_id,
			$author->ID,
			'The author ID does not match the expected user ID.'
		);
		$this->assertSame(
			$user->user_login,
			$author->login,
			'The author login does not match the expected user login.'
		);
		$this->assertSame(
			$user->first_name,
			$author->first_name,
			'The author first name does not match the expected first name.'
		);
		$this->assertSame(
			$user->last_name,
			$author->last_name,
			'The author last name does not match the expected last name.'
		);
		$this->assertSame(
			$user->user_nicename,
			$author->nice_name,
			'The author nicename does not match the expected nicename.'
		);
	}

	/**
	 * Generate a dummy endpoint.
	 */
	private function get_dummy_endpoint() {
		$endpoint = new Jetpack_JSON_API_Dummy_Base_Endpoint(
			array(
				'stat' => 'dummy',
			)
		);

		return $endpoint;
	}
}

/**
 * Dummy endpoint for testing.
 */
class Jetpack_JSON_API_Dummy_Base_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * Dummy result.
	 */
	public function result() {
		return 'success';
	}
}
