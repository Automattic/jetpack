<?php
/**
 * Protect dashboard feature flag tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use Automattic\Jetpack\My_Jetpack\Main_Features;
use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Jetpack_Protect_Dashboard_Feature_Flags
 */
#[CoversClass( Jetpack_Protect_Dashboard_Feature_Flags::class )]
class Jetpack_Protect_Dashboard_Feature_Flags_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Drop the flag filter. The flag itself is registered by the plugin bootstrap, so no reset.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD );
		parent::tear_down();
	}

	/**
	 * Turn the flag on.
	 */
	private function enable_flag() {
		add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, '__return_true' );
	}

	public function test_is_registered_by_the_plugin_bootstrap() {
		$this->assertNotNull( Feature_Flags::get( Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD ) );
	}

	public function test_is_off_by_default() {
		$this->assertFalse( Feature_Flags::is_enabled( Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD ) );
	}

	public function test_module_is_unavailable_while_the_flag_is_off() {
		$this->assertNotContains( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules() );
	}

	public function test_module_is_available_while_the_flag_is_on() {
		$this->enable_flag();

		$this->assertContains( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules() );
	}

	public function test_my_jetpack_follows_the_flag() {
		$this->enable_flag();

		// Main_Features memoizes per locale, so a locale nothing else uses gets a fresh read of the flag.
		add_filter(
			'locale',
			static function () {
				return 'protect_dashboard_flag_on';
			}
		);

		$this->assertTrue( Main_Features::get_feature_definitions()['protect-dashboard']['delivery']['jetpack'] );
	}
}
