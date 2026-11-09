<?php
/**
 * Monetize dashboard feature flag tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Monetize\Dashboard;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Jetpack_Monetize_Feature_Flags
 */
#[CoversClass( Jetpack_Monetize_Feature_Flags::class )]
class Jetpack_Monetize_Feature_Flags_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Drop any cached host answer from earlier tests.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
	}

	/**
	 * Drop the flag filter and host constants. The flag itself is registered by the plugin bootstrap, so no reset.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG );
		Constants::clear_constants();
		Cache::clear();
		parent::tear_down();
	}

	/**
	 * Whether the flag is on, the host constants to set, and whether the module should be available.
	 *
	 * @return array[]
	 */
	public static function provide_flag_states() {
		return array(
			'flag left at its default' => array( false, array(), false ),
			'flag turned on'           => array( true, array(), true ),
			'flag turned on, Atomic'   => array(
				true,
				array(
					'ATOMIC_SITE_ID'       => 1,
					'ATOMIC_CLIENT_ID'     => 2,
					'WPCOMSH__PLUGIN_FILE' => 'wpcomsh.php',
				),
				false,
			),
		);
	}

	/**
	 * @dataProvider provide_flag_states
	 *
	 * @param bool  $flag_on   Whether to turn the flag on.
	 * @param array $constants Host constants to set.
	 * @param bool  $available Whether the module should be available.
	 */
	#[DataProvider( 'provide_flag_states' )]
	public function test_module_is_available_only_with_the_flag_on_off_the_wpcom_platform( $flag_on, $constants, $available ) {
		if ( $flag_on ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG, '__return_true' );
		}
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}

		$this->assertSame( $available, in_array( Jetpack_Monetize_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}
}
