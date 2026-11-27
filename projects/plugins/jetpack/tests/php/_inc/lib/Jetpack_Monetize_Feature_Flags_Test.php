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
			'flag turned off'        => array( false, array(), false ),
			'flag turned on'         => array( true, array(), true ),
			'flag turned on, Atomic' => array(
				true,
				array(
					'ATOMIC_SITE_ID'       => 1,
					'ATOMIC_CLIENT_ID'     => 2,
					'WPCOMSH__PLUGIN_FILE' => 'wpcomsh.php',
				),
				true,
			),
			'flag turned on, Simple' => array( true, array( 'IS_WPCOM' => true ), false ),
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
	public function test_module_is_available_only_with_the_flag_on_off_simple( $flag_on, $constants, $available ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG, $flag_on ? '__return_true' : '__return_false' );
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}

		$this->assertSame( $available, in_array( Jetpack_Monetize_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}

	/**
	 * The versions a site moves between, or false for a new connection, the flag's value, and whether the module turns on.
	 *
	 * @return array[]
	 */
	public static function provide_activations() {
		return array(
			'new connection'               => array( false, false, null, true ),
			'upgrade from the last stable' => array( '16.4.1', '16.5', null, true ),
			'upgrade from a 16.5 alpha'    => array( '16.5-a.5', '16.5', null, true ),
			'upgrade past it'              => array( '16.5', '16.6', null, false ),
			'new connection with flag off' => array( false, false, false, false ),
		);
	}

	/**
	 * Jetpack turns on default modules when a site connects, and on upgrade the ones introduced since the old version.
	 *
	 * @dataProvider provide_activations
	 *
	 * @param string|false $from      The version upgraded from, or false for a new connection.
	 * @param string|false $to        The version upgraded to.
	 * @param bool|null    $flag      The flag filter's value, or null to leave the default.
	 * @param bool         $activates Whether the module should be a default.
	 */
	#[DataProvider( 'provide_activations' )]
	public function test_module_turns_on_by_default( $from, $to, $flag, $activates ) {
		if ( null !== $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Dashboard::FEATURE_FLAG, $flag ? '__return_true' : '__return_false' );
		}

		$this->assertSame( $activates, in_array( Jetpack_Monetize_Feature_Flags::MODULE, Jetpack::get_default_modules( $from, $to ), true ) );
	}
}
