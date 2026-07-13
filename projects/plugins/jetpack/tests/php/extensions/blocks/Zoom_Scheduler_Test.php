<?php
/**
 * Zoom Scheduler Block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Zoom_Scheduler;
require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/zoom-scheduler/zoom-scheduler.php';

/**
 * Zoom Scheduler block tests
 */
class Zoom_Scheduler_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * `load_assets` with empty attributes returns an empty string.
	 */
	public function test_load_assets_with_empty_attributes() {
		$content = Zoom_Scheduler\load_assets( array() );

		$this->assertSame( '', $content );
	}

	/**
	 * `load_assets` with a URL off the allow-list returns an empty string.
	 */
	public function test_load_assets_with_invalid_host() {
		$content = Zoom_Scheduler\load_assets( array( 'url' => 'https://example.com/evil' ) );

		$this->assertSame( '', $content );
	}

	/**
	 * `load_assets` with a valid Zoom Scheduler URL returns the embed iframe.
	 */
	public function test_load_assets_with_valid_url() {
		$content = Zoom_Scheduler\load_assets(
			array( 'url' => 'https://scheduler.zoom.us/your-name/discovery-call' )
		);

		$this->assertStringContainsString( '<iframe', $content );
		$this->assertStringContainsString( 'embed=true', $content );
		$this->assertStringContainsString( 'scheduler.zoom.us', $content );
	}
}
