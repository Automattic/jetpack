<?php
/**
 * Tests for the connection create/update permission checks.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Publicize\REST_API\Connections_Controller;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Class Connections_Controller_Test
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
class Connections_Controller_Test extends TestCase {

	/**
	 * The create route.
	 *
	 * @var string
	 */
	private const ROUTE = '/wpcom/v2/publicize/connections';

	/**
	 * The user IDs, keyed by role.
	 *
	 * @var array
	 */
	private $user_ids = array();

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Publicize instance.
	 *
	 * @var ?Publicize
	 */
	private $publicize = null;

	/**
	 * Connections controller instance.
	 *
	 * @var ?Connections_Controller
	 */
	private $controller = null;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		global $publicize, $wp_rest_server;

		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'save_meta' ) )->getMock();
		$publicize       = $this->publicize;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		foreach ( array( 'editor', 'author' ) as $role ) {
			$this->user_ids[ $role ] = wp_insert_user(
				array(
					'user_login' => 'dummy_' . $role,
					'user_pass'  => 'dummy_pass',
					'role'       => $role,
				)
			);
		}

		$this->controller = new Connections_Controller();

		add_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );

		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		wp_set_current_user( 0 );

		// Leaving this registered would add the routes to every later test in the process.
		remove_action( 'rest_api_init', array( $this->controller, 'register_routes' ) );

		/*
		 * Firing `rest_api_init` makes core cache a REST controller - and with it the
		 * item schema - on every post type object. Drop them, so that later tests see
		 * the post meta they register themselves.
		 */
		foreach ( get_post_types( array(), 'objects' ) as $post_type ) {
			$post_type->rest_controller = null;
		}

		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();

		$this->publicize  = null;
		$this->controller = null;
		$this->user_ids   = array();
	}

	/**
	 * An author cannot create a shared connection.
	 */
	public function test_author_cannot_create_shared_connection() {
		wp_set_current_user( $this->user_ids['author'] );

		$response = $this->server->dispatch( $this->create_request( true ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_share_connection', $response->get_data()['code'] );
	}

	/**
	 * Passing `shared: false` is still setting the flag, so it is gated too.
	 */
	public function test_author_cannot_create_connection_with_shared_false() {
		wp_set_current_user( $this->user_ids['author'] );

		$response = $this->server->dispatch( $this->create_request( false ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * An author can still create a regular connection.
	 *
	 * The permission check is asserted directly, so that the request does not
	 * get proxied to WPCOM.
	 */
	public function test_author_can_create_connection_without_shared() {
		wp_set_current_user( $this->user_ids['author'] );

		$this->assertTrue( $this->controller->create_item_permissions_check( $this->create_request( null ) ) );
	}

	/**
	 * An editor can create a shared connection.
	 */
	public function test_editor_can_create_shared_connection() {
		wp_set_current_user( $this->user_ids['editor'] );

		$this->assertTrue( $this->controller->create_item_permissions_check( $this->create_request( true ) ) );
	}

	/**
	 * Build a create request, optionally carrying the `shared` param.
	 *
	 * @param bool|null $shared The `shared` param, or null to omit it.
	 *
	 * @return WP_REST_Request
	 */
	private function create_request( $shared ) {
		$request = new WP_REST_Request( 'POST', self::ROUTE );

		$request->set_param( 'keyring_connection_ID', 123 );

		if ( null !== $shared ) {
			$request->set_param( 'shared', $shared );
		}

		return $request;
	}
}
