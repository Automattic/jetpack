<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Publicize;

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
	private static $connection_ids = array();

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
		$this->publicize = \Mockery::mock( Publicize::class )->makePartial();

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
		wp_set_current_user( $this->admin_id );

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
}
