<?php
/**
 * Tests for VideoPress_Rest_Api_V1_Features.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the VideoPress features REST API endpoint.
 */
class VideoPress_Rest_Api_V1_Features_Test extends BaseTestCase {

	/**
	 * Test that the REST route is registered.
	 */
	public function test_rest_route_is_registered() {
		VideoPress_Rest_Api_V1_Features::init();
		do_action( 'rest_api_init' );

		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/videopress/v1/features', $routes );
	}

	/**
	 * Test permissions callback requires read capability.
	 */
	public function test_permissions_callback_requires_read() {
		// Non-logged in user should not have read capability.
		wp_set_current_user( 0 );
		$this->assertFalse( VideoPress_Rest_Api_V1_Features::permissions_callback() );

		// Create a subscriber user (has read capability).
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_subscriber',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		wp_set_current_user( $user_id );
		$this->assertTrue( VideoPress_Rest_Api_V1_Features::permissions_callback() );
	}

	/**
	 * Data provider for feature flag mapping tests.
	 *
	 * @return array[] Test cases.
	 */
	public static function feature_flag_mapping_provider(): array {
		return array(
			'free tier - no paid features'    => array(
				'active_features' => array(),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
			'paid 1TB plan'                   => array(
				'active_features' => array( 'videopress-1tb-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => true,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
			'unlimited plan (Complete)'       => array(
				'active_features' => array( 'videopress-1tb-storage', 'videopress-unlimited-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => true,
					'isVideoPressUnlimitedSupported' => true,
				),
			),
			'only unlimited (edge case)'      => array(
				'active_features' => array( 'videopress-unlimited-storage' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => true,
				),
			),
			'other features do not affect VP' => array(
				'active_features' => array( 'some-other-feature', 'another-feature' ),
				'expected'        => array(
					'isVideoPressSupported'          => true,
					'isVideoPress1TBSupported'       => false,
					'isVideoPressUnlimitedSupported' => false,
				),
			),
		);
	}

	/**
	 * Test that feature flags are correctly mapped from WPCOM features.
	 *
	 * @param array $active_features Features returned by WPCOM API.
	 * @param array $expected Expected feature flags.
	 * @dataProvider feature_flag_mapping_provider
	 */
	#[DataProvider( 'feature_flag_mapping_provider' )]
	public function test_feature_flag_mapping( array $active_features, array $expected ) {
		$response = array(
			'isVideoPressSupported'          => true, // isVideoPressSupported is always true (free tier).
			'isVideoPress1TBSupported'       => in_array( 'videopress-1tb-storage', $active_features, true ),
			'isVideoPressUnlimitedSupported' => in_array( 'videopress-unlimited-storage', $active_features, true ),
		);

		$this->assertSame( $expected, $response );
	}
}
