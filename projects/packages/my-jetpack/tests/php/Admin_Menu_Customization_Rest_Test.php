<?php
/**
 * Admin menu customization REST API tests.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the admin menu customization REST endpoint.
 */
class Admin_Menu_Customization_Rest_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	private static $editor_user_id;

	/**
	 * Create shared users once for the test class.
	 *
	 * @throws \Exception If test user creation fails.
	 * @return void
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();

		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin_menu_customization_admin',
				'user_pass'  => 'pass',
				'user_email' => 'admin-menu-customization-admin@example.com',
				'role'       => 'administrator',
			)
		);

		$editor_id = wp_insert_user(
			array(
				'user_login' => 'admin_menu_customization_editor',
				'user_pass'  => 'pass',
				'user_email' => 'admin-menu-customization-editor@example.com',
				'role'       => 'editor',
			)
		);

		if ( is_wp_error( $admin_id ) || is_wp_error( $editor_id ) ) {
			throw new \Exception( 'Failed to create test users' );
		}

		self::$admin_user_id  = $admin_id;
		self::$editor_user_id = $editor_id;
	}

	/**
	 * Clean up test users.
	 *
	 * @return void
	 */
	public static function tearDownAfterClass(): void {
		parent::tearDownAfterClass();

		if ( self::$admin_user_id ) {
			wp_delete_user( self::$admin_user_id );
		}
		if ( self::$editor_user_id ) {
			wp_delete_user( self::$editor_user_id );
		}
	}

	/**
	 * Set up a REST server.
	 *
	 * @return void
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->reset_admin_menu_state();
		delete_option( Admin_Menu::CUSTOMIZATION_SITE_OPTION );
		delete_user_meta( self::$admin_user_id, Admin_Menu::CUSTOMIZATION_USER_META );
		delete_user_meta( self::$editor_user_id, Admin_Menu::CUSTOMIZATION_USER_META );
		remove_all_filters( Admin_Menu::CUSTOMIZATION_FEATURE_FILTER );
		remove_all_filters( Admin_Menu::CUSTOMIZATION_DEFAULT_ENABLED_FILTER );
		remove_all_filters( Admin_Menu::CUSTOMIZATION_ACTIVE_FILTER );

		add_filter( Admin_Menu::CUSTOMIZATION_FEATURE_FILTER, '__return_true' );
		add_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
		do_action( 'rest_api_init' );
		remove_action( 'rest_api_init', array( Initializer::class, 'register_rest_endpoints' ) );
	}

	/**
	 * Clean up after each test.
	 *
	 * @return void
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_all_filters( Admin_Menu::CUSTOMIZATION_FEATURE_FILTER );
		remove_all_filters( Admin_Menu::CUSTOMIZATION_DEFAULT_ENABLED_FILTER );
		remove_all_filters( Admin_Menu::CUSTOMIZATION_ACTIVE_FILTER );
	}

	/**
	 * Read endpoint returns the admin-ui customization model.
	 *
	 * @return void
	 */
	public function test_get_admin_menu_customization_model() {
		wp_set_current_user( self::$admin_user_id );
		Admin_Menu::add_menu( 'My Jetpack', 'My Jetpack', 'edit_posts', 'my-jetpack', '__return_null', -1 );
		Admin_Menu::add_menu( 'Scan', 'Scan', 'manage_options', 'jetpack-scan', '__return_null', 6 );

		$request  = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/admin-menu' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data['featureEnabled'] );
		$this->assertFalse( $data['active'] );
		$this->assertSame( array( 'my-jetpack', 'scan' ), array_column( $data['items'], 'id' ) );
	}

	/**
	 * Administrators can save the site default layout.
	 *
	 * @return void
	 */
	public function test_admin_can_save_site_layout() {
		wp_set_current_user( self::$admin_user_id );

		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/admin-menu' );
		$request->set_body_params(
			array(
				'scope'  => 'site',
				'layout' => array(
					'enabled' => true,
					'groups'  => array(
						'create' => array(
							'label' => 'Make',
							'order' => 20,
						),
					),
				),
			)
		);

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data['siteLayout']['enabled'] );
		$this->assertSame( 'Make', $data['siteLayout']['groups']['create']['label'] );
	}

	/**
	 * Non-administrators cannot save the site default layout.
	 *
	 * @return void
	 */
	public function test_editor_cannot_save_site_layout() {
		wp_set_current_user( self::$editor_user_id );

		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/admin-menu' );
		$request->set_body_params(
			array(
				'scope'  => 'site',
				'layout' => array(
					'enabled' => true,
				),
			)
		);

		$response = $this->server->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Resets Admin_Menu static state.
	 *
	 * @return void
	 */
	private function reset_admin_menu_state() {
		$reflection = new \ReflectionClass( Admin_Menu::class );

		foreach ( array( 'menu_items' => array(), 'initialized' => false ) as $property_name => $value ) {
			if ( ! $reflection->hasProperty( $property_name ) ) {
				continue;
			}

			$property = $reflection->getProperty( $property_name );
			// @todo Remove this call once we no longer need to support PHP <8.1.
			if ( PHP_VERSION_ID < 80100 ) {
				$property->setAccessible( true );
			}
			$property->setValue( null, $value );
		}
	}
}
