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
	 * The flag filter's value (null to leave the default), and whether the module should be available.
	 *
	 * @return array[]
	 */
	public static function provide_flag_states() {
		return array(
			'flag left at its default' => array( null, true ),
			'flag turned off'          => array( false, false ),
		);
	}

	/**
	 * @dataProvider provide_flag_states
	 *
	 * @param bool|null $flag      The flag filter's value, or null to leave the default.
	 * @param bool      $available Whether the module should be available.
	 */
	#[DataProvider( 'provide_flag_states' )]
	public function test_module_is_available_only_while_the_flag_is_on( $flag, $available ) {
		if ( null !== $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, $flag ? '__return_true' : '__return_false' );
		}

		$this->assertSame( $available, in_array( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}
}
