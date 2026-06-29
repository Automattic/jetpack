<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the portable Modules REST API endpoints.
 *
 * Runs in the package's WorDBless environment, i.e. with the My Jetpack package loaded but
 * WITHOUT the full Jetpack plugin — the same situation as a standalone plugin (Boost, Backup, …)
 * or a WordPress.com Simple site. This locks the cross-plugin behavior: the routes register
 * wherever My Jetpack initializes, and resolve gracefully when no Jetpack module system exists.
 *
 * Each test runs in a separate process so its Initializer::init() bootstrap and the Modules
 * class's process-level static cache can't leak into sibling tests.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\REST_Modules
 */
class Modules_Rest_Test extends TestCase {

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The current user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * The secondary (editor) user id.
	 *
	 * @var int
	 */
	private static $secondary_user_id;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );

		self::$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$user_id );

		self::$secondary_user_id = wp_insert_user(
			array(
				'user_login' => 'test_editor',
				'user_pass'  => '123',
				'role'       => 'editor',
			)
		);
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();

		unset( $_SERVER['REQUEST_METHOD'] );
		$_GET = array();
	}

	/**
	 * Test that the modules routes register wherever My Jetpack initializes (cross-plugin).
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_modules_routes_are_registered() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/my-jetpack/v1/site/modules', $routes );
		$this->assertArrayHasKey( '/my-jetpack/v1/site/modules/(?P<slug>[a-z0-9\-]+)', $routes );
	}

	/**
	 * Test GET modules resolves gracefully (200, array) without the Jetpack plugin's module system.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_modules_returns_array() {
		$request  = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/modules' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertIsArray( $response->get_data() );
	}

	/**
	 * Test GET modules as an editor (edit_posts) is allowed.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_modules_with_editor() {
		wp_set_current_user( self::$secondary_user_id );

		$request  = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/modules' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Test GET modules not logged in is rejected.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_modules_not_logged() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/modules' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that a platform can supply module state via the my_jetpack_site_modules filter
	 * (this is how Simple sites fill the list with no Jetpack plugin present).
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_modules_applies_platform_filter() {
		add_filter(
			'my_jetpack_site_modules',
			function ( $modules ) {
				$modules['fake-module'] = array(
					'module'           => 'fake-module',
					'name'             => 'Fake Module',
					'description'      => '',
					'long_description' => '',
					'search_terms'     => '',
					'available'        => true,
					'activated'        => false,
				);
				return $modules;
			}
		);

		$request  = new WP_REST_Request( 'GET', '/my-jetpack/v1/site/modules' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertArrayHasKey( 'fake-module', $data );
		$this->assertEquals( 'Fake Module', $data['fake-module']['name'] );
	}

	/**
	 * Test that toggling a module returns the new state ( { module, activated } ).
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_set_module_returns_state() {
		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/modules/fake-module' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'active' => true ), JSON_UNESCAPED_SLASHES ) );

		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 200, $response->get_status() );
		$this->assertEquals( 'fake-module', $data['module'] );
		$this->assertTrue( $data['activated'] );
	}

	/**
	 * Test that a platform can handle toggling via the my_jetpack_set_module action.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_set_module_fires_platform_action() {
		$called = array();
		add_action(
			'my_jetpack_set_module',
			function ( $slug, $active ) use ( &$called ) {
				$called = array( $slug, $active );
			},
			10,
			2
		);

		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/modules/fake-module' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'active' => true ), JSON_UNESCAPED_SLASHES ) );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		// 'fake-module' is not a real Jetpack module, so the platform action handles it.
		$this->assertEquals( array( 'fake-module', true ), $called );
	}

	/**
	 * Test POST modules not logged in is rejected.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_set_module_not_logged() {
		wp_set_current_user( 0 );

		$request = new WP_REST_Request( 'POST', '/my-jetpack/v1/site/modules/fake-module' );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'active' => true ), JSON_UNESCAPED_SLASHES ) );

		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}
}
