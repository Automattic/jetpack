<?php
/**
 * Protect dashboard feature flag tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

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
	 * Whether the flag is turned on, which is also whether the module should be available.
	 *
	 * @return array[]
	 */
	public static function provide_flag_states() {
		return array(
			'flag left at its default' => array( false ),
			'flag on'                  => array( true ),
		);
	}

	/**
	 * @dataProvider provide_flag_states
	 *
	 * @param bool $flag_on Whether to turn the flag on.
	 */
	#[DataProvider( 'provide_flag_states' )]
	public function test_module_is_available_only_while_the_flag_is_on( $flag_on ) {
		if ( $flag_on ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, '__return_true' );
		}

		$this->assertSame( $flag_on, in_array( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}
}
