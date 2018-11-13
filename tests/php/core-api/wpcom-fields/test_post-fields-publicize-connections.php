<?php

require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-jetpack-rest-testcase.php';
require_once JETPACK__PLUGIN_DIR . '/tests/php/lib/class-wp-test-spy-rest-server.php';

/**
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field extends WP_Test_Jetpack_REST_Testcase {
	static private $user_id = 0;

	private $draft_id = 0;

	public static function wpSetUpBeforeClass( $factory ) {
		register_post_type( 'example-with', array(
			'show_in_rest' => true,
			'supports' => array( 'publicize', 'custom-fields' )
		) );

		register_post_type( 'example-without', array(
			'show_in_rest' => true,
			'supports' => array( 'publicize' )
		) );

		add_post_type_support( 'post', 'publicize' );

		self::$user_id = $factory->user->create( array( 'role' => 'administrator' ) );

		Jetpack_Options::update_options( array(
			'publicize_connections' => array(
				// Normally connected facebook
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
				// Globally connected tumblr
				'tumblr' => array(
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
		) );
	}

	public function setUp() {
		parent::setUp();

		wp_set_current_user( self::$user_id );

		// Not sure why this needs to be done in ->setUp() instead of in ::wpSetUpBeforeClass(),
		// but it does. Otherwise, test_update_message passes when:
		// phpunit --filter=Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field
		// but fails when:
		// phpunit --group=rest-api
		global $publicize;
		$publicize->register_post_meta();

		$this->draft_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
	}

	public function test_register_fields_posts() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/posts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
	}

	public function test_register_fields_custom_post_type_with_custom_fields_support() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-with' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	public function test_register_fields_custom_post_type_without_custom_fields_support() {
		$request  = new WP_REST_Request( 'OPTIONS', '/wp/v2/example-without' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	public function test_response() {
		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $data );
		$this->assertInternalType( 'array', $data['jetpack_publicize_connections'] );
		$this->assertSame( array( 'test-unique-id456', 'test-unique-id123' ), wp_list_pluck( $data['jetpack_publicize_connections'], 'id' ) );

		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $data['meta'] );
		$this->assertInternalType( 'string', $data['meta']['jetpack_publicize_message'] );
		$this->assertEmpty( $data['meta']['jetpack_publicize_message'] );
	}

	public function test_update_message() {
		$request  = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params( array(
			'meta' => array(
				'jetpack_publicize_message' => 'example',
			),
		) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 'example', $data['meta']['jetpack_publicize_message'] );
	}

	public function test_update_connections_by_id() {
		$request  = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params( array(
			'jetpack_publicize_connections' => array(
				array(
					'id' => 'test-unique-id123',
					'enabled' => false,
				),
			),
		) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'test-unique-id123' !== $connection->id, $connection->enabled );
		}
	}

	public function test_update_connections_by_service_name() {
		$request  = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params( array(
			'jetpack_publicize_connections' => array(
				array(
					'service_name' => 'facebook',
					'enabled' => false,
				),
			),
		) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'facebook' !== $connection->service_name, $connection->enabled );
		}
	}
}
