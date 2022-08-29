<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Publicize;

use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Posts as WorDBless_Posts;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-publicize
 */
class Test_Connections_Post_Field  extends TestCase {

	/**
	 * User ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Connection IDs.
	 *
	 * @var array
	 */
	private static $connection_ids = array( 'test-unique-id456', 'test-unique-id123' );

	/**
	 * Draft ID.
	 *
	 * @var int
	 */
	public $draft_id;

	/**
	 * If cleanup is needed.
	 *
	 * @var bool
	 */
	private $needs_cleanup = true;

	/**
	 * REST API additional fields.
	 *
	 * @var array
	 */
	private $wp_rest_additional_fields = null;
	/**
	 * Publicize instance.
	 *
	 * @var ?Publicize
	 */
	private $publicize = null;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		$this->setup_jetpack_connections();
		global $publicize;
		$this->publicize = $this->getMockBuilder( Publicize::class )->setMethods( array( 'refresh_connections' ) )->getMock();

		$this->publicize->method( 'refresh_connections' )
			->withAnyParameters()
			->willReturn( null );

		$publicize = $this->publicize;
		register_post_type(
			'example-with',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'publicize', 'custom-fields' ),
			)
		);

		register_post_type(
			'example-without',
			array(
				'show_in_rest' => true,
				'supports'     => array( 'publicize' ),
			)
		);

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user3',
				'user_pass'  => 'dummy_pass4',
				'role'       => 'susbcriber',
			)
		);

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;
		add_post_type_support( 'post', 'publicize' );

		// Register REST routes.
		$this->publicize->register_post_meta();
		add_action( 'rest_api_init', array( new REST_Controller(), 'register_rest_routes' ), 4 );
		add_action( 'rest_api_init', array( new Connections_Post_Field(), 'register_fields' ), 5 );
		do_action( 'rest_api_init' );

		wp_set_current_user( $this->admin_id );
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );
		$user->set_role( 'administrator' );

		$this->draft_id = wp_insert_post(
			array(
				'post_author'           => $this->admin_id,
				'post_content'          => '',
				'post_content_filtered' => '',
				'post_title'            => 'acd',
				'post_excerpt'          => 'dsad',
				'post_status'           => 'draft',
				'post_type'             => 'post',
				'comment_status'        => '',
				'ping_status'           => '',
				'post_password'         => '',
				'to_ping'               => '',
				'pinged'                => '',
				'post_parent'           => 0,
				'menu_order'            => 0,
				'guid'                  => '',
				'import_id'             => 0,
				'context'               => '',
				'post_date'             => '',
				'post_date_gmt'         => '',
			)
		);

	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		unregister_post_type( 'example-with' );
		unregister_post_type( 'example-without' );
		$publicizeable_post_types = array();
		foreach ( get_post_types() as $post_type ) {
			if ( ! $this->publicize->post_type_is_publicizeable( $post_type ) ) {
				continue;
			}

			$publicizeable_post_types[] = $post_type;
			unregister_meta_key( 'post', $this->publicize->POST_MESS, $post_type );
		}

		remove_post_type_support( 'post', 'publicize' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Test register fields post
	 */
	public function test_register_fields_posts() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	/**
	 * Test register fields post with custom fields
	 */
	public function test_register_fields_custom_post_type_with_custom_fields_support() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-with' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$schema = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	/**
	 * Test register fields post without custom fields
	 */
	public function test_register_fields_custom_post_type_without_custom_fields_support() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-without' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	/**
	 * Test the response of a post
	 */
	public function test_response() {

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $data );
		$this->assertTrue( true, gettype( $data['jetpack_publicize_connections'] ) === 'array' );
		$this->assertSame( self::$connection_ids, wp_list_pluck( $data['jetpack_publicize_connections'], 'id' ) );

		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $data['meta'] );
		$this->assertTrue( gettype( $data['meta']['jetpack_publicize_message'] ) === 'string' );
		$this->assertEmpty( $data['meta']['jetpack_publicize_message'] );
	}

	/**
	 * Dummy function to initialize publicize connections.
	 */
	public function get_connections() {
		return array(
			'publicize_connections' => array(
				// Normally connected facebook.
				'facebook' => array(
					'id_number' => array(
						'connection_data' => array(
							'user_id'  => self::$user_id,
							'token_id' => 'test-unique-id456',
							'meta'     => array(
								'display_name' => 'test-display-name456',
							),
						),
					),
				),
				// Globally connected tumblr.
				'tumblr'   => array(
					'id_number' => array(
						'connection_data' => array(
							'user_id'  => 0,
							'token_id' => 'test-unique-id123',
							'meta'     => array(
								'display_name' => 'test-display-name123',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Dummy function to initialize publicize connections.
	 */
	public function setup_jetpack_connections() {
		Jetpack_Options::update_options(
			$this->get_connections()
		);
	}

	/**
	 * Test updating jetpack_publicize_message.
	 */
	public function test_update_message() {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'meta' => array(
					'jetpack_publicize_message' => 'example',
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 'example', $data['meta']['jetpack_publicize_message'] );
	}

	/**
	 * Test updating by connection id.
	 */
	public function test_update_connections_by_id() {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'id'      => 'test-unique-id123',
						'enabled' => false,
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'test-unique-id123' !== $connection->id, $connection->enabled );
		}
	}

	/**
	 * Test updating by service name.
	 */
	public function test_update_connections_by_service_name() {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'service_name' => 'facebook',
						'enabled'      => false,
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'facebook' !== $connection->service_name, $connection->enabled );
		}
	}

	/**
	 * Test that connections are enabled when the publicize_checkbox_default filter isn't used.
	 */
	public function test_default_checkbox_filter() {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$this->server->dispatch( $request );

		foreach ( self::$connection_ids as $unique_id ) {
			$skip_key = $this->publicize->POST_SKIP . $unique_id;
			$this->assertEmpty( get_post_meta( $this->draft_id, $skip_key, true ) );
		}
	}

	/**
	 * Test that connections are skipped when the publicize_checkbox_default filter is used.
	 */
	public function test_default_checkbox_filter_disabled() {
		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$filter_func = function ( $default ) {
			return false;
		};

		add_filter( 'publicize_checkbox_default', $filter_func );
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$this->server->dispatch( $request );

		foreach ( self::$connection_ids as $unique_id ) {
			$skip_key = $this->publicize->POST_SKIP . $unique_id;
			$this->assertNotEmpty( get_post_meta( $this->draft_id, $skip_key, true ) );
		}

		remove_filter( 'publicize_checkbox_default', $filter_func );
	}
}
