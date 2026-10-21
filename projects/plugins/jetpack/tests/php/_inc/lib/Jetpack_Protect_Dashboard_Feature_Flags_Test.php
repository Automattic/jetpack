<?php
/**
 * Protect dashboard feature flag tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack_Protect_Dashboard_Feature_Flags
 */
#[CoversClass( Jetpack_Protect_Dashboard_Feature_Flags::class )]
class Jetpack_Protect_Dashboard_Feature_Flags_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Drop the flag filter and host constants. The flag itself is registered by the plugin bootstrap, so no reset.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD );
		Constants::clear_constants();
		Cache::clear();
		parent::tear_down();
	}

	/**
	 * The flag filter's value (null to leave the default), the host constants to set, and whether the module should be available.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		return array(
			'flag left at its default'      => array( null, array(), true ),
			'flag turned off'               => array( false, array(), false ),
			'flag on, WordPress.com Atomic' => array(
				null,
				array(
					'ATOMIC_SITE_ID'       => 1,
					'ATOMIC_CLIENT_ID'     => 1,
					'WPCOMSH__PLUGIN_FILE' => true,
				),
				false,
			),
			'flag on, WordPress.com Simple' => array( null, array( 'IS_WPCOM' => true ), false ),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param bool|null $flag      The flag filter's value, or null to leave the default.
	 * @param array     $constants Host constants to set.
	 * @param bool      $available Whether the module should be available.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_module_is_available_only_with_the_flag_on_outside_wordpress_com( $flag, $constants, $available ) {
		if ( null !== $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, $flag ? '__return_true' : '__return_false' );
		}
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		Cache::clear();

		$this->assertSame( $available, in_array( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}
}
