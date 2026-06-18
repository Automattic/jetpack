<?php
/**
 * Test file for Automattic\Jetpack\Sync\Settings
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * Class Settings_Test
 *
 * @covers Automattic\Jetpack\Sync\Settings
 */
#[CoversClass( Settings::class )]
class Settings_Test extends BaseTestCase {

	/**
	 * Runs after every test in this class.
	 */
	protected function tearDown(): void {
		delete_option( 'jetpack_sync_settings_post_meta_whitelist' );
		parent::tearDown();
	}

	/**
	 * Denied post meta should be excluded from the sync post meta whitelist setting.
	 */
	public function test_denied_post_meta_removed_from_post_meta_whitelist_setting() {
		update_option( 'jetpack_sync_settings_post_meta_whitelist', array( '_fl_builder_history_state_0', 'allowed_custom_meta' ), true );

		$list = Settings::get_setting( 'post_meta_whitelist' );

		$this->assertNotContains( '_fl_builder_history_state_0', $list );
		$this->assertContains( 'allowed_custom_meta', $list );
	}
}
