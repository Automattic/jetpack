<?php // phpcs:ignore
/**
 * Tests for /wpcom/v2/transients endpoints.
 */

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Class WP_Test_WPCOM_REST_API_V2_Endpoint_Transient
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Transient
 */
class WP_Test_WPCOM_REST_API_V2_Endpoint_Transient extends WP_Test_Jetpack_REST_Testcase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Name of test transient.
	 *
	 * @var string
	 */
	private $transient_name = 'jetpack_connected_user_data_1';

	/**
	 * Value of test transient.
	 *
	 * @var array
	 */
	private $transient_value = array( 'setting' => 'value' );

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function setUp() {
		parent::setUp();

		wp_set_current_user( static::$user_id );
		set_transient( $this->transient_name, $this->transient_value );
	}

	/**
	 * Tests the permission check.
	 *
	 * @covers ::delete_transient_permissions_check
	 */
	public function test_delete_transient_permissions_check() {
		wp_set_current_user( 0 );

		$request  = wp_rest_request( Requests::DELETE, '/wpcom/v2/transients/' . $this->transient_name );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Tests delete transient.
	 *
	 * @covers ::delete_transient_permissions_check
	 * @covers ::delete_transient
	 */
	public function test_delete_transient() {
		$request  = wp_rest_request( Requests::DELETE, '/wpcom/v2/transients/' . $this->transient_name );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( array( 'success' => true ), $response->get_data() );
		$this->assertIsNotArray( get_transient( $this->transient_name ) );
	}
}
