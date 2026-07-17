<?php
/**
 * Tests for VideoPress_Rest_Api_V1_Features.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\My_Jetpack\Product;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Tests for the VideoPress features REST API endpoint.
 */
class VideoPress_Rest_Api_V1_Features_Test extends BaseTestCase {

	/**
	 * REST server instance.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up the test environment.
	 */
	public function setUp(): void {
		parent::setUp();

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		// Create a user with read capability.
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);

		// Register REST routes.
		VideoPress_Rest_Api_V1_Features::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();

		global $wp_rest_server;
		$wp_rest_server = null;

		wp_set_current_user( 0 );
	}

	/**
	 * Test that the REST route is registered.
	 */
	public function test_rest_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/videopress/v1/features', $routes );
	}

	/**
	 * Test that unauthenticated requests are rejected.
	 */
	public function test_unauthenticated_request_rejected() {
		wp_set_current_user( 0 );

		$request  = new WP_REST_Request( 'GET', '/videopress/v1/features' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 401, $response->get_status() );
	}

	/**
	 * Test that authenticated requests succeed.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_authenticated_request_succeeds() {
		wp_set_current_user( $this->user_id );

		// Seed the transient to avoid WPCOM API call.
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => array(),
				'available' => array(),
			),
			15
		);

		$request  = new WP_REST_Request( 'GET', '/videopress/v1/features' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
	}

	/**
	 * Data provider for feature flag mapping tests.
	 *
	 * @return array[] Test cases.
	 */
	public static function feature_flag_mapping_provider(): array {
		return array(
			'free tier - no paid features'             => array(
				'active_features' => array(),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
			'paid 1TB plan'                            => array(
				'active_features' => array( 'videopress-1tb-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => true,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
			'unlimited plan (Complete)'                => array(
				'active_features' => array( 'videopress-1tb-storage', 'videopress-unlimited-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => true,
					'isVideoPressUnlimitedSupported' => true,
				),
			),
			'only unlimited (edge case)'               => array(
				'active_features' => array( 'videopress-unlimited-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => true,
				),
			),
			'other features do not affect VP'          => array(
				'active_features' => array( 'some-other-feature', 'another-feature' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => false,
				),
			),

			/*
			 * Note: The 'videopress' feature check is guarded by Host::is_wpcom_platform().
			 * In this test environment (non-wpcom), that returns false, so 'videopress'
			 * alone won't trigger isVideoPress1TBSupported. On actual WordPress.com sites,
			 * is_wpcom_platform() returns true and the 'videopress' feature would work.
			 */
			'wpcom videopress feature (non-wpcom env)' => array(
				'active_features' => array( 'videopress' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
			'both 1TB and wpcom videopress'            => array(
				'active_features' => array( 'videopress-1tb-storage', 'videopress' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => true,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
		);
	}

	/**
	 * Test that the endpoint correctly maps WPCOM features to VideoPress feature flags.
	 *
	 * This test seeds the My Jetpack transient cache with mock data, then dispatches
	 * a REST request to the endpoint. Each test runs in a separate process to avoid
	 * static cache pollution from Product::get_site_features_from_wpcom().
	 *
	 * @param array $active_features Features that would be returned by WPCOM API.
	 * @param array $expected Expected feature flags from the endpoint.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider feature_flag_mapping_provider
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'feature_flag_mapping_provider' )]
	public function test_feature_flag_mapping( array $active_features, array $expected ) {
		wp_set_current_user( $this->user_id );

		// Seed the transient that Product::get_site_features_from_wpcom() checks.
		// This bypasses the WPCOM API call since the transient is checked first.
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => $active_features,
				'available' => array(),
			),
			15
		);

		// Dispatch actual REST request.
		$request  = new WP_REST_Request( 'GET', '/videopress/v1/features' );
		$response = $this->server->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );
		$this->assertSame( $expected, $response->get_data() );
	}
}
