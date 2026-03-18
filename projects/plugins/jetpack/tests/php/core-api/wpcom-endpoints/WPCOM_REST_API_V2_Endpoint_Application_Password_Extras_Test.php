<?php
/**
 * Tests for /wpcom/v2/application-password-extras endpoints.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WpOrg\Requests\Requests;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';
require_once JETPACK__PLUGIN_DIR . '/_inc/lib/class-jetpack-application-password-extras.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_Application_Password_Extras_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_Application_Password_Extras
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_Application_Password_Extras::class )]
class WPCOM_REST_API_V2_Endpoint_Application_Password_Extras_Test extends Jetpack_REST_TestCase {

	/**
	 * Mock user ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Create shared database fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	/**
	 * Setup the environment for a test.
	 */
	public function set_up() {
		parent::set_up();

		// Initialize the class to ensure it's available
		Jetpack_Application_Password_Extras::init();

		wp_set_current_user( static::$user_id );
	}

	/**
	 * Test that routes are registered correctly.
	 */
	public function test_routes_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/wpcom/v2/application-password-extras/abilities', $routes );
		$this->assertArrayHasKey( '/wpcom/v2/application-password-extras/admin-ajax', $routes );
	}

	/**
	 * Test permission check for unauthenticated users.
	 */
	public function test_unauthenticated_user_cannot_access_abilities() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/application-password-extras/abilities' );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
		$data = $response->get_data();
		$this->assertEquals( 'Sorry, you must be logged in to access this endpoint.', $data['message'] );
	}

	/**
	 * Test permission check for authenticated users.
	 */
	public function test_authenticated_user_can_access_abilities() {
		wp_set_current_user( static::$user_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/application-password-extras/abilities' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test that get_abilities endpoint returns correct data.
	 */
	public function test_get_abilities_endpoint_returns_correct_data() {
		wp_set_current_user( static::$user_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/application-password-extras/abilities' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'admin-ajax', $data );
		$this->assertTrue( $data['admin-ajax'] );
	}

	/**
	 * Data provider for endpoint tests
	 *
	 * @return array
	 */
	public static function endpoint_provider() {
		return array(
			'abilities endpoint'  => array( '/wpcom/v2/application-password-extras/abilities' ),
			'admin-ajax endpoint' => array( '/wpcom/v2/application-password-extras/admin-ajax' ),
		);
	}

	/**
	 * Test that all endpoints work correctly for authenticated users.
	 *
	 * @dataProvider endpoint_provider
	 * @param string $endpoint The endpoint to test.
	 */
	#[DataProvider( 'endpoint_provider' )]
	public function test_endpoints_work_for_authenticated_users( $endpoint ) {
		wp_set_current_user( static::$user_id );

		$request  = new WP_REST_Request( Requests::GET, $endpoint );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertArrayHasKey( 'admin-ajax', $data );
	}

	/**
	 * Test that all endpoints require authentication.
	 *
	 * @dataProvider endpoint_provider
	 * @param string $endpoint The endpoint to test.
	 */
	#[DataProvider( 'endpoint_provider' )]
	public function test_endpoints_require_authentication( $endpoint ) {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( Requests::GET, $endpoint );
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_forbidden', $response, 401 );
	}

	/**
	 * Test that editor users can access abilities.
	 */
	public function test_editor_can_access_abilities() {
		$editor_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $editor_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/application-password-extras/abilities' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertIsArray( $data );
	}

	/**
	 * Test that only GET requests are allowed.
	 */
	public function test_only_get_requests_allowed() {
		wp_set_current_user( static::$user_id );

		$disallowed_methods = array(
			Requests::POST,
			Requests::PUT,
			Requests::DELETE,
			Requests::PATCH,
		);

		foreach ( $disallowed_methods as $method ) {
			$request  = new WP_REST_Request( $method, '/wpcom/v2/application-password-extras/abilities' );
			$response = $this->server->dispatch( $request );

			// Routes that don't support a method typically return 404 (not found) in WordPress REST API
			$this->assertContains(
				$response->get_status(),
				array( 404, 405 ),
				"Method $method should not be allowed (status should be 404 or 405)"
			);
		}
	}

	/**
	 * Test response headers are set correctly.
	 */
	public function test_response_headers() {
		wp_set_current_user( static::$user_id );

		$request  = new WP_REST_Request( Requests::GET, '/wpcom/v2/application-password-extras/abilities' );
		$response = $this->server->dispatch( $request );

		$headers = $response->get_headers();

		// Standard REST API headers should be present
		$this->assertIsArray( $headers );
	}
}
