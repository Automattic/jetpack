<?php

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;
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
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */]
class Connections_Post_Field_Test extends TestCase {

	/**
	 * User ID.
	 *
	 * @var int
	 */
	private static $user_id = 0;

	/**
	 * Token IDs.
	 *
	 * @var array
	 */
	private static $connection_ids = array( '456', '123' );

	/**
	 * Connection IDs.
	 *
	 * @var array
	 */
	private static $token_ids = array( 'test-unique-id456', 'test-unique-id123' );

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
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * WP_REST_Server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		self::reset_active_plan_cache();
		global $publicize;
		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'refresh_connections', 'test_connection', 'has_paid_features' ) )->getMock();

		$this->publicize->method( 'refresh_connections' )
			->withAnyParameters()
			->willReturn( null );

		$this->publicize->method( 'test_connection' )
			->withAnyParameters()
			->willReturn( true );

		$publicize = $this->publicize;

		$this->setup_jetpack_connections();

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
		add_action( 'rest_api_init', array( new REST_API\Connections_Post_Field(), 'register_fields' ), 5 );
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
	 */
	public function tearDown(): void {
		parent::tearDown();
		unregister_post_type( 'example-with' );
		unregister_post_type( 'example-without' );
		$this->unregister_publicize_post_meta();

		remove_post_type_support( 'post', 'publicize' );
		delete_transient( Connections::CONNECTIONS_TRANSIENT );
		self::reset_active_plan_cache();
		WorDBless_Options::init()->clear_options();
		WorDBless_Posts::init()->clear_all_posts();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Force the next `Current_Plan::get()` to re-read from the option store.
	 */
	private static function reset_active_plan_cache() {
		$reflection = new \ReflectionClass( Current_Plan::class );
		$property   = $reflection->getProperty( 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Set the active plan features.
	 *
	 * @param array $features Active plan features.
	 */
	private function set_active_plan_features( $features ) {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = $features;
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		self::reset_active_plan_cache();
	}

	/**
	 * Unregister Publicize post meta keys.
	 */
	private function unregister_publicize_post_meta() {
		$meta_keys = array(
			$this->publicize->POST_MESS,
			Publicize_Base::POST_PUBLICIZE_FEATURE_ENABLED,
			$this->publicize->POST_DONE . 'all',
			Publicize_Base::POST_JETPACK_SOCIAL_OPTIONS,
			Publicize_Base::POST_CONNECTION_OVERRIDES,
			Publicize_Base::POST_CUSTOMIZE_PER_NETWORK,
		);

		foreach ( get_post_types() as $post_type ) {
			foreach ( $meta_keys as $meta_key ) {
				unregister_meta_key( 'post', $meta_key, $post_type );
			}
		}
	}

	/**
	 * Re-register Publicize post meta keys.
	 */
	private function reregister_publicize_post_meta() {
		$this->unregister_publicize_post_meta();
		$this->publicize->register_post_meta();
	}

	/**
	 * Get the registered default for the per-network customization meta key.
	 *
	 * @return bool
	 */
	private function get_customize_per_network_registered_default() {
		$registered_meta = get_registered_meta_keys( 'post', 'post' );

		return $registered_meta[ Publicize_Base::POST_CUSTOMIZE_PER_NETWORK ]['default'];
	}

	/**
	 * Set the cached connections list.
	 *
	 * @param string $template Connection template value.
	 */
	private function set_cached_connection_with_template( $template ) {
		set_transient(
			Connections::CONNECTIONS_TRANSIENT,
			array(
				array(
					'service_name'  => 'facebook',
					'id'            => 'facebook-1',
					'connection_id' => 'facebook-1000',
					'external_id'   => 'external-facebook-1',
					'shared'        => true,
					'template'      => $template,
					'wpcom_user_id' => 0,
					'status'        => 'ok',
				),
			),
			HOUR_IN_SECONDS
		);
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
	 * Test that per-network customization defaults on with a custom connection template.
	 */
	public function test_customize_per_network_defaults_on_with_custom_connection_template() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );
		$this->set_active_plan_features( array( 'social-message-templates' ) );
		$this->set_cached_connection_with_template( 'Custom template' );
		$this->reregister_publicize_post_meta();

		$this->assertTrue( $this->get_customize_per_network_registered_default() );

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertTrue( $data['meta'][ Publicize_Base::POST_CUSTOMIZE_PER_NETWORK ] );
	}

	/**
	 * Test that per-network customization defaults off without a custom connection template.
	 */
	public function test_customize_per_network_defaults_off_without_custom_connection_template() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );
		$this->set_active_plan_features( array( 'social-message-templates' ) );
		$this->set_cached_connection_with_template( '   ' );
		$this->reregister_publicize_post_meta();

		$this->assertFalse( $this->get_customize_per_network_registered_default() );
	}

	/**
	 * Test that an explicitly saved false value overrides the dynamic default.
	 */
	public function test_customize_per_network_explicit_false_overrides_template_default() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );
		$this->set_active_plan_features( array( 'social-message-templates' ) );
		$this->set_cached_connection_with_template( 'Custom template' );
		$this->reregister_publicize_post_meta();

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'meta' => array(
					Publicize_Base::POST_CUSTOMIZE_PER_NETWORK => false,
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertFalse( $data['meta'][ Publicize_Base::POST_CUSTOMIZE_PER_NETWORK ] );

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertFalse( $data['meta'][ Publicize_Base::POST_CUSTOMIZE_PER_NETWORK ] );
	}

	/**
	 * Test the response of a post
	 */
	public function test_response() {
		$this->markTestSkipped();

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertArrayHasKey( 'jetpack_publicize_connections', $data );
		$this->assertTrue( true, gettype( $data['jetpack_publicize_connections'] ) === 'array' );
		$this->assertSame( self::$token_ids, wp_list_pluck( $data['jetpack_publicize_connections'], 'id' ) );

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
			// Normally connected facebook.
			'facebook' => array(
				'id_number' => array(
					'connection_data' => array(
						'user_id'       => self::$user_id,
						'id'            => '456',
						'connection_id' => '4560',
						'token_id'      => 'test-unique-id456',
						'meta'          => array(
							'display_name' => 'test-display-name456',
						),
					),
				),
			),
			// Globally connected tumblr.
			'tumblr'   => array(
				'id_number' => array(
					'connection_data' => array(
						'user_id'       => 0,
						'id'            => '123',
						'connection_id' => '1230',
						'token_id'      => 'test-unique-id123',
						'meta'          => array(
							'display_name' => 'test-display-name123',
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
		$this->publicize->receive_updated_publicize_connections( $this->get_connections() );
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
		$this->markTestSkipped();
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'id'      => '123',
						'enabled' => false,
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			if ( $connection->id === '123' ) {
				$this->assertFalse( $connection->enabled );
			} else {
				$this->assertTrue( $connection->enabled );
			}
		}
	}

	/**
	 * Test updating by service name.
	 */
	public function test_update_connections_by_service_name() {
		$this->markTestSkipped();
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'service_name'  => 'facebook',
						'enabled'       => false,
						'connection_id' => '4560',
					),
				),
			)
		);
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertNotEmpty( $data['jetpack_publicize_connections'] );

		foreach ( $data['jetpack_publicize_connections'] as $connection ) {
			if ( $connection->connection_id === '4560' ) {
				$this->assertFalse( $connection->enabled );
			} else {
				$this->assertTrue( $connection->enabled );

			}
		}
	}

	/**
	 * A brand new published post must honor `enabled: false` and skip the
	 * disabled connection. Regression test for the create-time drop where the
	 * skip meta was only memoized, never persisted, for new posts.
	 */
	public function test_create_published_post_skips_disabled_connection() {
		// get_filtered_connection_data() reads connections from the transient.
		set_transient(
			Connections::CONNECTIONS_TRANSIENT,
			array(
				array(
					'service_name'  => 'facebook',
					'id'            => '456',
					'connection_id' => '4560',
					'external_id'   => 'external-456',
					'shared'        => true,
					'wpcom_user_id' => 0,
					'status'        => 'ok',
				),
				array(
					'service_name'  => 'tumblr',
					'id'            => '123',
					'connection_id' => '1230',
					'external_id'   => 'external-123',
					'shared'        => true,
					'wpcom_user_id' => 0,
					'status'        => 'ok',
				),
			),
			HOUR_IN_SECONDS
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
		$request->set_body_params(
			array(
				'title'                         => 'publicize create-drop repro',
				'status'                        => 'publish',
				'jetpack_publicize_connections' => array(
					array(
						'connection_id' => '4560',
						'enabled'       => false,
					),
				),
			)
		);

		$response = $this->server->dispatch( $request );
		$post_id  = $response->get_data()['id'];

		$this->assertSame( 'publish', get_post_status( $post_id ) );

		// The disabled connection must be flagged to skip.
		$this->assertNotEmpty(
			get_post_meta( $post_id, $this->publicize->POST_SKIP_PUBLICIZE . '4560', true )
		);

		// The connection left enabled must not be skipped.
		$this->assertEmpty(
			get_post_meta( $post_id, $this->publicize->POST_SKIP_PUBLICIZE . '1230', true )
		);
	}

	/**
	 * A brand new published post with no disabled connections must share to all
	 * of them (no skip meta written).
	 *
	 * Guards against resolving the connection defaults against the already
	 * published post: the built-in `publicize_checkbox_default` filter returns
	 * false for published posts, which would mark every connection to skip and
	 * stop new posts from sharing at all.
	 */
	public function test_create_published_post_shares_to_all_connections_by_default() {
		set_transient(
			Connections::CONNECTIONS_TRANSIENT,
			array(
				array(
					'service_name'  => 'facebook',
					'id'            => '456',
					'connection_id' => '4560',
					'external_id'   => 'external-456',
					'shared'        => true,
					'wpcom_user_id' => 0,
					'status'        => 'ok',
				),
				array(
					'service_name'  => 'tumblr',
					'id'            => '123',
					'connection_id' => '1230',
					'external_id'   => 'external-123',
					'shared'        => true,
					'wpcom_user_id' => 0,
					'status'        => 'ok',
				),
			),
			HOUR_IN_SECONDS
		);

		$request = new WP_REST_Request( 'POST', '/wp/v2/posts' );
		$request->set_body_params(
			array(
				'title'  => 'publicize create shares all',
				'status' => 'publish',
			)
		);

		$post_id = $this->server->dispatch( $request )->get_data()['id'];

		$this->assertSame( 'publish', get_post_status( $post_id ) );

		// Nothing was disabled, so neither connection may be skipped.
		$this->assertEmpty(
			get_post_meta( $post_id, $this->publicize->POST_SKIP_PUBLICIZE . '4560', true )
		);
		$this->assertEmpty(
			get_post_meta( $post_id, $this->publicize->POST_SKIP_PUBLICIZE . '1230', true )
		);
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
		$this->markTestSkipped();
		// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$filter_func = function ( $default ) {
			return false;
		};

		add_filter( 'publicize_checkbox_default', $filter_func );
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$this->server->dispatch( $request );

		foreach ( self::$connection_ids as $unique_id ) {
			$skip_key = $this->publicize->POST_SKIP_PUBLICIZE . $unique_id;
			$this->assertNotEmpty( get_post_meta( $this->draft_id, $skip_key, true ) );
		}

		remove_filter( 'publicize_checkbox_default', $filter_func );
	}

	/**
	 * Test saving connection overrides via REST API.
	 */
	public function test_save_connection_overrides() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );

		// Enable per-network customization.
		update_post_meta( $this->draft_id, Publicize_Base::POST_CUSTOMIZE_PER_NETWORK, true );

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'connection_id'  => '4560',
						'enabled'        => true,
						'message'        => 'Custom message for this connection',
						'attached_media' => array(
							array(
								'id'   => 123,
								'url'  => 'https://example.com/image.jpg',
								'type' => 'image/jpeg',
							),
						),
					),
				),
			)
		);
		$this->server->dispatch( $request );

		$overrides = get_post_meta( $this->draft_id, Publicize_Base::POST_CONNECTION_OVERRIDES, true );

		$this->assertIsArray( $overrides );
		$this->assertArrayHasKey( '4560', $overrides );
		$this->assertSame( 'Custom message for this connection', $overrides['4560']['message'] );
		$this->assertCount( 1, $overrides['4560']['attached_media'] );
		$this->assertSame( 123, $overrides['4560']['attached_media'][0]['id'] );
	}

	/**
	 * Test that connection overrides are NOT saved when user lacks paid features.
	 */
	public function test_connection_overrides_not_saved_without_paid_features() {
		// Override the has_paid_features method to return false for this test.
		$this->publicize->method( 'has_paid_features' )
			->willReturn( false );

		// Enable per-network customization flag (should be ignored without paid features).
		update_post_meta( $this->draft_id, Publicize_Base::POST_CUSTOMIZE_PER_NETWORK, true );

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'connection_id'  => '4560',
						'enabled'        => true,
						'message'        => 'Custom message for this connection',
						'attached_media' => array(
							array(
								'id'   => 123,
								'url'  => 'https://example.com/image.jpg',
								'type' => 'image/jpeg',
							),
						),
					),
				),
			)
		);
		$this->server->dispatch( $request );

		$overrides = get_post_meta( $this->draft_id, Publicize_Base::POST_CONNECTION_OVERRIDES, true );

		// Assert that overrides were NOT saved.
		$this->assertEmpty( $overrides );
	}

	/**
	 * Test that connection overrides are stored and retrieved from post meta.
	 */
	public function test_get_connection_overrides() {
		// Set up override data directly in post meta.
		$override_data = array(
			'4560' => array(
				'message'        => 'Test override message',
				'attached_media' => array(
					array(
						'id'   => 100,
						'url'  => 'https://example.com/test.jpg',
						'type' => 'image/jpeg',
					),
				),
			),
		);

		update_post_meta(
			$this->draft_id,
			Publicize_Base::POST_CONNECTION_OVERRIDES,
			$override_data
		);

		// Verify the data can be retrieved from post meta.
		$retrieved = get_post_meta( $this->draft_id, Publicize_Base::POST_CONNECTION_OVERRIDES, true );

		$this->assertIsArray( $retrieved );
		$this->assertArrayHasKey( '4560', $retrieved );
		$this->assertSame( 'Test override message', $retrieved['4560']['message'] );
		$this->assertCount( 1, $retrieved['4560']['attached_media'] );
		$this->assertSame( 100, $retrieved['4560']['attached_media'][0]['id'] );
	}

	/**
	 * Test that connection overrides are cleared when no message or media is provided.
	 */
	public function test_clear_connection_overrides() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );

		// First, set up some override data.
		update_post_meta(
			$this->draft_id,
			Publicize_Base::POST_CONNECTION_OVERRIDES,
			array(
				'4560' => array(
					'message'        => 'Should be cleared',
					'attached_media' => array(),
				),
			)
		);

		// Now update without message or attached_media.
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'connection_id' => '4560',
						'enabled'       => true,
					),
				),
			)
		);
		$this->server->dispatch( $request );

		$overrides = get_post_meta( $this->draft_id, Publicize_Base::POST_CONNECTION_OVERRIDES, true );

		// Overrides should be empty or not contain the connection.
		$this->assertTrue( empty( $overrides ) || ! isset( $overrides['4560'] ) );
	}

	/**
	 * Test that attached_media is properly sanitized.
	 */
	public function test_sanitize_attached_media() {
		$this->publicize->method( 'has_paid_features' )
			->willReturn( true );

		// Enable per-network customization.
		update_post_meta( $this->draft_id, Publicize_Base::POST_CUSTOMIZE_PER_NETWORK, true );

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'jetpack_publicize_connections' => array(
					array(
						'connection_id'  => '4560',
						'enabled'        => true,
						'message'        => 'Test',
						'attached_media' => array(
							array(
								'id'   => '456',  // String should become int.
								'url'  => 'javascript:alert(1)', // Invalid URL should be sanitized.
								'type' => '<script>alert(1)</script>', // XSS should be sanitized.
							),
							array(
								'id'   => 789,
								'url'  => 'https://example.com/valid.jpg',
								'type' => 'image/jpeg',
							),
						),
					),
				),
			)
		);
		$this->server->dispatch( $request );

		$overrides = get_post_meta( $this->draft_id, Publicize_Base::POST_CONNECTION_OVERRIDES, true );

		$this->assertIsArray( $overrides );
		$this->assertArrayHasKey( '4560', $overrides );

		$media = $overrides['4560']['attached_media'];

		// First item: id should be int, url should be empty (invalid), type should be sanitized.
		$this->assertSame( 456, $media[0]['id'] );
		$this->assertSame( '', $media[0]['url'] );
		$this->assertStringNotContainsString( '<script>', $media[0]['type'] );

		// Second item should be valid.
		$this->assertSame( 789, $media[1]['id'] );
		$this->assertSame( 'https://example.com/valid.jpg', $media[1]['url'] );
		$this->assertSame( 'image/jpeg', $media[1]['type'] );
	}
}
