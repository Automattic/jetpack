<?php
/**
 * Jetpack_JSON_API_Endpoint class unit tests.
 * Run this test with command: jetpack docker phpunit -- --filter=WP_Test_Jetpack_Base_Json_Api_Endpoints
 *
 * @package automattic/jetpack
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Generic tests for Jetpack_JSON_API_Endpoint.
 */
class WP_Test_Jetpack_Base_Json_Api_Endpoints extends WP_UnitTestCase {
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
