<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests for Admin_Color_Schemes class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Admin_Color_Schemes;

require_once JETPACK__PLUGIN_DIR . 'tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/admin-color-schemes/class-admin-color-schemes.php';

/**
 * Class Test_Admin_Color_Schemes.
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Admin_Color_Schemes
 */
class Test_Admin_Color_Schemes extends WP_Test_Jetpack_REST_Testcase {

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
		static::$user_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	/**
	 * Set up each test.
	 */
	public function set_up() {
		new Admin_Color_Schemes();

		parent::set_up();
	}

	/**
	 * Tests the schema response for OPTIONS requests.
	 */
	public function test_schema_request() {
		$request  = new WP_REST_Request( Requests::OPTIONS, '/wp/v2/users/' . static::$user_id );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema = ( new WP_REST_Users_Controller() )->get_public_item_schema();

		$this->assertEquals( $schema, $data['schema'] );
		$this->assertArrayHasKey( 'meta', $data['schema']['properties'] );
		$this->assertArrayHasKey( 'admin_color', $data['schema']['properties']['meta']['properties'] );
	}

	/**
	 * Tests retrieving the color scheme setting for a user.
	 *
	 * @covers ::register_admin_color_meta
	 */
	public function test_get_color_scheme() {
		wp_set_current_user( static::$user_id );

		$request  = new WP_REST_Request( Requests::GET, '/wp/v2/users/' . static::$user_id );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'admin_color', $data['meta'] );
		$this->assertSame( 'fresh', $data['meta']['admin_color'] );
	}

	/**
	 * Tests updating the color scheme setting for a user.
	 *
	 * @covers ::register_admin_color_meta
	 */
	public function test_update_color_scheme() {
		wp_set_current_user( static::$user_id );

		// Editor can update their own meta value.
		$request = new WP_REST_Request( Requests::PUT, '/wp/v2/users/' . static::$user_id );
		$request->set_body_params(
			array(
				'meta' => array(
					'admin_color' => 'classic',
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'admin_color', $data['meta'] );
		$this->assertSame( 'classic', $data['meta']['admin_color'] );

		// Editor can't update someone else's meta value.
		$request = new WP_REST_Request( Requests::PUT, '/wp/v2/users/1' );
		$request->set_body_params(
			array(
				'meta' => array(
					'admin_color' => 'classic',
				),
			)
		);
		$response = $this->server->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_edit', $response, WP_Http::FORBIDDEN );
	}
}
