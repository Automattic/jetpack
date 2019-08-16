<?php

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * Tests that Posts and Custom Post Types do have Publicize data in REST API
 * responses if the Publicize Module is active.
 *
 * In this test environment, the Publicize Module is not active so this class
 * has hacks that load the Publicize API code as if the Publicize Module were active.
 *
 * (This class's complement, Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field_Inactive,
 * has no such hacks so (mostly) provides an environment like the one in which
 * the Publicize Module is not active.)
 *
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field extends WP_Test_Jetpack_REST_Testcase {
	static private $user_id = 0;
	static private $connection_ids = [];

	private $draft_id = 0;
	private $needs_cleanup = true;
	private $wp_rest_additional_fields = null;
	private $publicize = null;

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

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			self::setup_connections_wpcom();
		} else {
			self::setup_connections_jetpack();
		}
	}

	public static function wpTearDownAfterClass() {
		unregister_post_type( 'example-with' );
		unregister_post_type( 'example-without' );

		remove_post_type_support( 'post', 'publicize' );
	}

	static function setup_connections_wpcom() {
		global $wpdb;

		$wpdb->insert( 'external_access_tokens', array( 'user_id' => self::$user_id, 'external_display' => 'test-display-name456', 'token' => 'fb-token', 'provider' => 'facebook' ) );
		$keyring_token_id = (string) $wpdb->insert_id;
		self::$connection_ids[] = $keyring_token_id;
		$wpdb->insert( 'publicize_connections', array( 'user_id' => self::$user_id, 'token_id' => $keyring_token_id, 'blog_id' => get_current_blog_id() ) );

		$wpdb->insert( 'external_access_tokens', array( 'user_id' => self::$user_id, 'external_display' => 'test-display-name123', 'token' => 't-token', 'provider' => 'tumblr' ) );
		$keyring_token_id = (string) $wpdb->insert_id;
		self::$connection_ids[] = $keyring_token_id;
		$wpdb->insert( 'publicize_connections', array( 'user_id' => 0 /* global connection */, 'token_id' => $keyring_token_id, 'blog_id' => get_current_blog_id() ) );
	}

	static function setup_connections_jetpack() {
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

		self::$connection_ids[] = 'test-unique-id456';
		self::$connection_ids[] = 'test-unique-id123';
	}

	public function setUp() {
		$this->draft_id = $this->factory->post->create( array( 'post_status' => 'draft', 'post_author' => self::$user_id ) );

		parent::setUp();

		$this->setup_fields();

		wp_set_current_user( self::$user_id );

		// Not sure why this needs to be done in ->setUp() instead of in ::wpSetUpBeforeClass(),
		// but it does. Otherwise, test_update_message passes when:
		// phpunit --filter=Test_WPCOM_REST_API_V2_Post_Publicize_Connections_Field
		// but fails when:
		// phpunit --group=rest-api
		$this->publicize = publicize_init();
		$this->publicize->register_post_meta();

		// Flush the schema cache for those Posts Controllers that need it.
		// https://core.trac.wordpress.org/changeset/45811/
		$GLOBALS['wp_rest_server']->override_by_default = true;
		foreach ( get_post_types() as $post_type ) {
			if ( ! $this->publicize->post_type_is_publicizeable( $post_type ) ) {
				continue;
			}

			$controller = new WP_REST_Posts_Controller( $post_type );
			$controller->register_routes();
		}
		$GLOBALS['wp_rest_server']->override_by_default = false;
	}

	public function tearDown() {
		$publicizeable_post_types = [];
		// Clean up custom meta from publicizeable post types
		foreach ( get_post_types() as $post_type ) {
			if ( ! $this->publicize->post_type_is_publicizeable( $post_type ) ) {
				continue;
			}

			$publicizeable_post_types[] = $post_type;
			unregister_meta_key( 'post', $this->publicize->POST_MESS, $post_type );
		}

		// Flush the schema cache for those Posts Controllers that need it.
		// https://core.trac.wordpress.org/changeset/45811/
		$GLOBALS['wp_rest_server']->override_by_default = true;
		foreach ( $publicizeable_post_types as $post_type ) {
			$controller = new WP_REST_Posts_Controller( $post_type );
			$controller->register_routes();
		}
		$GLOBALS['wp_rest_server']->override_by_default = false;

		$this->teardown_fields();

		parent::tearDown();

		wp_delete_post( $this->draft_id, true );
	}

	private function setup_fields() {
		if ( isset( $GLOBALS['wpcom_rest_api_v2_plugins']['WPCOM_REST_API_V2_Post_Publicize_Connections_Field'] ) ) {
			/*
			 * If WPCOM_REST_API_V2_Post_Publicize_Connections_Field is already loaded in this environment,
			 * we don't have to do anything interesting.
			 */
			$this->needs_cleanup = false;
		} else {
			/*
			 * Otherwise, we need to load WPCOM_REST_API_V2_Post_Publicize_Connections_Field, call its
			 * ->register_fields() (since do_action( 'rest_api_init' ) has already been called at this
			 * point), and remember to manually clean up after ourselves.
			 */
			$this->wp_rest_additional_fields = isset( $GLOBALS['wp_rest_additional_fields'] ) ? $GLOBALS['wp_rest_additional_fields'] : 'unset';
			wpcom_rest_api_v2_load_plugin( 'WPCOM_REST_API_V2_Post_Publicize_Connections_Field' );
			$GLOBALS['wpcom_rest_api_v2_plugins']['WPCOM_REST_API_V2_Post_Publicize_Connections_Field']->register_fields();
			$this->needs_cleanup = true;
		}
	}

	private function teardown_fields() {
		if ( ! $this->needs_cleanup ) {
			return;
		}

		if ( 'unset' === $this->wp_rest_additional_fields ) {
			unset( $GLOBALS['wp_rest_additional_fields'] );
		} else {
			$GLOBALS['wp_rest_additional_fields'] = $this->wp_rest_additional_fields;
		}

		$this->wp_rest_additional_fields = null;

		unset( $GLOBALS['wpcom_rest_api_v2_plugins']['WPCOM_REST_API_V2_Post_Publicize_Connections_Field'] );
	}

	public function test_register_fields_posts() {
		$request  = wp_rest_request( 'OPTIONS', '/wp/v2/posts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	public function test_register_fields_custom_post_type_with_custom_fields_support() {
		$request  = wp_rest_request( 'OPTIONS', '/wp/v2/example-with' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	public function test_register_fields_custom_post_type_without_custom_fields_support() {
		$request  = wp_rest_request( 'OPTIONS', '/wp/v2/example-without' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();
		$schema   = $data['schema'];

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $schema['properties'] );
		$this->assertArrayHasKey( 'meta', $schema['properties'] );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $schema['properties']['meta']['properties'] );
	}

	public function test_response() {
		$request  = wp_rest_request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $data );
		$this->assertInternalType( 'array', $data['jetpack_publicize_connections'] );
		$this->assertSame( self::$connection_ids, wp_list_pluck( $data['jetpack_publicize_connections'], 'id' ) );

		$this->assertArrayHasKey( 'meta', $data );
		$this->assertArrayHasKey( 'jetpack_publicize_message', $data['meta'] );
		$this->assertInternalType( 'string', $data['meta']['jetpack_publicize_message'] );
		$this->assertEmpty( $data['meta']['jetpack_publicize_message'] );
	}

	public function test_update_message() {
		$request  = wp_rest_request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
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
		$request  = wp_rest_request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
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

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'test-unique-id123' !== $connection->id, $connection->enabled );
		}
	}

	public function test_update_connections_by_service_name() {
		$request  = wp_rest_request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
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

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			$this->assertSame( 'facebook' !== $connection->service_name, $connection->enabled );
		}
	}
}
