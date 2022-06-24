<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

/**
 * Tests that Posts and Custom Post Types do not have Publicize data in REST API
 * responses if the Publicize Module is not active.
 *
 * In this test environment, the Publicize Module is not active so
 * Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field (this class's complementary class)
 * has hacks that load the Publicize API code as if the Publicize Module were active.
 *
 * This class has no such hacks, so (mostly) provides an environment like the one in which
 * the Publicize Module is not active.
 * ("Mostly": When the Publicize Module is not active, modules/publicize.php is not loaded.
 * In this test environment, though, that file is always loaded because of
 * tests/php/modules/publicize/test_class.publicize.php.)
 *
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field_Inactive extends WP_Test_Jetpack_REST_Testcase {
	/**
	 * User ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	private $draft_id = 0;

	public static function wpSetUpBeforeClass( $factory ) {
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

		self::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );

		Jetpack_Options::update_options(
			array(
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
			)
		);
	}

	public static function wpTearDownAfterClass() {
		unregister_post_type( 'example-with' );
		unregister_post_type( 'example-without' );
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		wp_set_current_user( self::$user_id );
	}

	public function test_register_fields_posts() {
		$this->markTestSkipped();

		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayNotHasKey( 'jetpack_publicize_connections', $schema['properties'] );
	}

	public function test_register_fields_custom_post_type_with_custom_fields_support() {
		$this->markTestSkipped();
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-with' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayNotHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		if ( isset( $schema['properties']['meta'] ) ) {
			$this->assertArrayNotHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
		}
	}

	public function test_register_fields_custom_post_type_without_custom_fields_support() {
		$this->markTestSkipped();
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-without' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayNotHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		if ( isset( $schema['properties']['meta'] ) ) {
			$this->assertArrayNotHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
		}
	}

	public function test_response() {
		$this->markTestSkipped();
		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayNotHasKey( 'jetpack_publicize_connections', $data );

		if ( isset( $data['meta'] ) ) {
			$this->assertArrayNotHasKey( 'jetpack_publicize_message', $data['meta'] );
		}
	}
}
