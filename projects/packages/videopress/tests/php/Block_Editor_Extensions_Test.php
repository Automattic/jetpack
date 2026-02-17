<?php
/**
 * Tests for Automattic\Jetpack\VideoPress\Block_Editor_Extensions
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Class Block_Editor_Extensions_Test
 *
 * Note: Tests for Jetpack site behavior are limited because the can_upload_to_videopress
 * method relies on Status::is_active(), Current_Plan::supports(), and a direct WP_Query
 * check for VideoPress videos, which are tested separately and difficult to mock due to
 * class autoloading.
 */
class Block_Editor_Extensions_Test extends BaseTestCase {

	/**
	 * Test can_upload_to_videopress returns true for Dotcom simple sites.
	 *
	 * On Dotcom sites, VideoPress should always handle video uploads
	 * to show appropriate errors/upsell messages.
	 */
	public function test_can_upload_to_videopress_returns_true_for_simple_sites() {
		$result = $this->invoke_can_upload_to_videopress( 'simple' );
		$this->assertTrue( $result );
	}

	/**
	 * Test can_upload_to_videopress returns true for Dotcom atomic sites.
	 *
	 * On Dotcom sites, VideoPress should always handle video uploads
	 * to show appropriate errors/upsell messages.
	 */
	public function test_can_upload_to_videopress_returns_true_for_atomic_sites() {
		$result = $this->invoke_can_upload_to_videopress( 'atomic' );
		$this->assertTrue( $result );
	}

	/**
	 * Test can_upload_to_videopress returns false for Jetpack sites by default.
	 *
	 * Without VideoPress being active, Jetpack sites should fall back to core/video.
	 * This test verifies the default behavior when VideoPress is not active.
	 */
	public function test_can_upload_to_videopress_returns_false_for_jetpack_sites_by_default() {
		// Without any plugins active, Status::is_active() returns false
		// so can_upload_to_videopress should return false for jetpack sites.
		$result = $this->invoke_can_upload_to_videopress( 'jetpack' );
		$this->assertFalse( $result );
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
