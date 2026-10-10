<?php
/**
 * Settings feature flag tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Jetpack_Settings_Feature_Flags
 */
#[CoversClass( Jetpack_Settings_Feature_Flags::class )]
class Jetpack_Settings_Feature_Flags_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Drop the kill-switch filter. The flag itself is registered by the plugin bootstrap, so no reset.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Jetpack_Settings_Feature_Flags::WP_BUILD );
		parent::tear_down();
	}

	public function test_is_registered_by_the_plugin_bootstrap() {
		$this->assertNotNull( Feature_Flags::get( Jetpack_Settings_Feature_Flags::WP_BUILD ) );
	}

	public function test_is_on_by_default() {
		$this->assertTrue( Feature_Flags::is_enabled( Jetpack_Settings_Feature_Flags::WP_BUILD ) );
	}

	public function test_is_a_kill_switch() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Settings_Feature_Flags::WP_BUILD, '__return_false' );

		$this->assertFalse( Feature_Flags::is_enabled( Jetpack_Settings_Feature_Flags::WP_BUILD ) );
	}
}
