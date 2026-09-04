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

	const BLOCK_NAME = 'jetpack/zoom-scheduler';

	/**
	 * Whether the block was already registered before these tests ran.
	 *
	 * @var bool
	 */
	private $was_registered;

	/**
	 * Setup and ensure the block is registered before running the tests.
	 */
	public function set_up() {
		parent::set_up();
		$this->was_registered = \Automattic\Jetpack\Blocks::is_registered( self::BLOCK_NAME );
		Zoom_Scheduler\register_block();
	}

	/**
	 * Teardown and unregister the block if it wasn't registered before running these tests.
	 */
	public function tear_down() {
		if ( ! $this->was_registered ) {
			unregister_block_type( self::BLOCK_NAME );
		}
		parent::tear_down();
	}

	/**
	 * Test that the block can be registered.
	 */
	public function test_block_can_be_registered() {
		$this->assertTrue( \Automattic\Jetpack\Blocks::is_registered( self::BLOCK_NAME ) );
	}

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
