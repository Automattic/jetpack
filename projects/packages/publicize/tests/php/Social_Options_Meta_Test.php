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
 * Unit tests for the jetpack_social_options post meta REST schema.
 *
 * @package automattic/jetpack-publicize
 */
#[AllowMockObjectsWithoutExpectations /* getStubBuilder() (for partial stubs) doesn't exist until PHPUnit 12.5. */ ]
class Social_Options_Meta_Test extends TestCase {

	/**
	 * Draft post ID.
	 *
	 * @var int
	 */
	private $draft_id;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Publicize instance.
	 *
	 * @var Publicize
	 */
	private $publicize;

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
		$this->publicize = $this->getMockBuilder( Publicize::class )->onlyMethods( array( 'refresh_connections' ) )->getMock();

		$this->publicize->method( 'refresh_connections' )
			->withAnyParameters()
			->willReturn( null );

		$publicize = $this->publicize;

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );
		$user = wp_get_current_user();
		$user->add_cap( 'manage_options' );
		$user->set_role( 'administrator' );

		add_post_type_support( 'post', 'publicize' );

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		$this->publicize->register_post_meta();
		do_action( 'rest_api_init' );

		$this->draft_id = wp_insert_post(
			array(
				'post_author'           => $this->admin_id,
				'post_content'          => '',
				'post_content_filtered' => '',
				'post_title'            => 'Focal point test',
				'post_excerpt'          => '',
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

		remove_post_type_support( 'post', 'publicize' );
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
	 * Dispatch a REST request updating jetpack_social_options with the given focal points map.
	 *
	 * @param array $focal_points The image_focal_points value to save.
	 * @return \WP_REST_Response The REST response.
	 */
	private function update_focal_points( $focal_points ) {
		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$request->set_body_params(
			array(
				'meta' => array(
					'jetpack_social_options' => array(
						'version'            => 2,
						'image_focal_points' => $focal_points,
					),
				),
			)
		);

		return $this->server->dispatch( $request );
	}

	/**
	 * Test that the image_focal_points map round-trips through the REST API.
	 */
	public function test_image_focal_points_round_trip_through_rest() {
		$focal_points = array(
			'123' => array(
				'x' => 0.25,
				'y' => 0.75,
			),
			'456' => array(
				'x' => 0.5,
				'y' => 0.1,
			),
		);

		$response = $this->update_focal_points( $focal_points );
		$this->assertSame( 200, $response->get_status() );

		$request  = new WP_REST_Request( 'GET', sprintf( '/wp/v2/posts/%d', $this->draft_id ) );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( $focal_points, $data['meta']['jetpack_social_options']['image_focal_points'] );
	}

	/**
	 * Test that out-of-range focal point coordinates are rejected.
	 */
	public function test_image_focal_points_reject_out_of_range_coordinates() {
		$response = $this->update_focal_points(
			array(
				'123' => array(
					'x' => 1.5,
					'y' => 0.5,
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_out_of_bounds', $response->get_data()['code'] );
	}

	/**
	 * Test that unknown properties inside a focal point are rejected.
	 */
	public function test_image_focal_points_reject_unknown_point_properties() {
		$response = $this->update_focal_points(
			array(
				'123' => array(
					'x'    => 0.5,
					'y'    => 0.5,
					'zoom' => 2,
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_additional_properties_forbidden', $response->get_data()['code'] );
	}

	/**
	 * Test that non-numeric map keys are rejected.
	 */
	public function test_image_focal_points_reject_non_numeric_keys() {
		$response = $this->update_focal_points(
			array(
				'not-an-id' => array(
					'x' => 0.5,
					'y' => 0.5,
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_additional_properties_forbidden', $response->get_data()['code'] );
	}
}
