<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Block_Editor_Extensions
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Current_Plan;
use WorDBless\BaseTestCase;

/**
 * Class Block_Editor_Extensions_Test
 *
 * Tests for the can_upload_to_videopress method, which determines whether
 * VideoPress should handle video uploads based on site type, plugin status,
 * and plan features.
 *
 * @see \Automattic\Jetpack\VideoPress\Block_Editor_Extensions
 */
class Block_Editor_Extensions_Test extends BaseTestCase {

	/**
	 * Set up once before all tests in this class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		// Load mock plugin to make Status::is_standalone_plugin_active() return true.
		require_once __DIR__ . '/assets/videopress-mock-plugin.txt';
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		// Reset Current_Plan's static cache so option changes take effect.
		$reflection = new \ReflectionClass( Current_Plan::class );
		$property   = $reflection->getProperty( 'active_plan_cache' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );

		parent::tear_down();
	}

	/**
	 * Test can_upload_to_videopress returns true for Dotcom simple sites.
	 */
	public function test_can_upload_to_videopress_returns_true_for_simple_sites() {
		$result = $this->invoke_can_upload_to_videopress( 'simple' );
		$this->assertTrue( $result );
	}

	/**
	 * Test can_upload_to_videopress returns true for Dotcom atomic sites.
	 */
	public function test_can_upload_to_videopress_returns_true_for_atomic_sites() {
		$result = $this->invoke_can_upload_to_videopress( 'atomic' );
		$this->assertTrue( $result );
	}

	/**
	 * Test can_upload_to_videopress returns true for Jetpack sites with
	 * a plan that has videopress-1tb-storage.
	 */
	public function test_can_upload_with_1tb_storage_plan() {
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_complete',
				'class'        => 'complete',
				'features'     => array(
					'active' => array( 'videopress-1tb-storage' ),
				),
			)
		);

		$result = $this->invoke_can_upload_to_videopress( 'jetpack' );
		$this->assertTrue( $result, 'Should allow uploads with 1TB storage plan' );
	}

	/**
	 * Test can_upload_to_videopress returns true for Jetpack sites with
	 * a plan that has videopress-unlimited-storage.
	 */
	public function test_can_upload_with_unlimited_storage_plan() {
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_complete',
				'class'        => 'complete',
				'features'     => array(
					'active' => array( 'videopress-unlimited-storage' ),
				),
			)
		);

		$result = $this->invoke_can_upload_to_videopress( 'jetpack' );
		$this->assertTrue( $result, 'Should allow uploads with unlimited storage plan' );
	}

	/**
	 * Test can_upload_to_videopress returns true for Jetpack sites without
	 * a paid plan when they have no VideoPress videos yet (free video).
	 */
	public function test_can_upload_with_free_video_available() {
		// No plan features, no existing VideoPress videos.
		$result = $this->invoke_can_upload_to_videopress( 'jetpack' );
		$this->assertTrue( $result, 'Should allow upload when free video slot is available' );
	}

	/**
	 * Helper method to invoke the private can_upload_to_videopress method.
	 *
	 * @param string $site_type The site type to test with.
	 * @return bool The result of can_upload_to_videopress.
	 */
	private function invoke_can_upload_to_videopress( $site_type ) {
		$reflection = new \ReflectionClass( Block_Editor_Extensions::class );
		$method     = $reflection->getMethod( 'can_upload_to_videopress' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( null, $site_type );
	}
}
