<?php
/**
 * Protect dashboard feature flag tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Protect\Dashboard;
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
			'flag left at its default'        => array( null, array(), true ),
			'flag turned off'                 => array( false, array(), false ),
			'flag on, WordPress.com Atomic'   => array(
				null,
				array(
					'ATOMIC_SITE_ID'       => 1,
					'ATOMIC_CLIENT_ID'     => 1,
					'WPCOMSH__PLUGIN_FILE' => true,
				),
				false,
			),
			'flag on, WordPress.com Simple'   => array( null, array( 'IS_WPCOM' => true ), false ),
			'flag on, Jetpack Protect active' => array( null, array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), false ),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param bool|null $flag      The flag filter's value, or null to leave the default.
	 * @param array     $constants Constants to set.
	 * @param bool      $available Whether the module should be available.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_module_is_available_only_where_the_page_can_load( $flag, $constants, $available ) {
		if ( null !== $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, $flag ? '__return_true' : '__return_false' );
		}
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		Cache::clear();

		$this->assertSame( $available, in_array( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_available_modules(), true ) );
	}

	/**
	 * The version a site upgrades from (false for a new connection), the constants to set, whether the module turns on, and the flag filter's value.
	 *
	 * @return array[]
	 */
	public static function provide_activations() {
		return array(
			'new connection'                   => array( false, array(), true ),
			'upgrade from the last stable'     => array( '16.3.1', array(), true ),
			'upgrade from an alpha without it' => array( '16.4-a.3', array(), true ),
			'Jetpack Protect plugin active'    => array( false, array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), true ),
			'upgrade with Jetpack Protect'     => array( '16.3.1', array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), true ),
			'upgrade past it, Jetpack Protect' => array( '16.4-a.4', array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), false ),
			'flag off, Jetpack Protect'        => array( false, array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), false, false ),
		);
	}

	/**
	 * Jetpack turns on default modules when a site connects, and on upgrade the ones introduced since the old version.
	 * With the Jetpack Protect plugin active the module is still recorded, though hidden, so the page appears once that plugin is gone.
	 *
	 * @dataProvider provide_activations
	 *
	 * @param string|false $from      The version upgraded from, or false for a new connection.
	 * @param array        $constants Constants to set.
	 * @param bool         $activates Whether the module should be a default.
	 * @param bool|null    $flag      The flag filter's value, or null to leave the default.
	 */
	#[DataProvider( 'provide_activations' )]
	public function test_module_turns_on_by_default( $from, $constants, $activates, $flag = null ) {
		if ( null !== $flag ) {
			add_filter( 'jetpack_feature_flag_enabled_' . Jetpack_Protect_Dashboard_Feature_Flags::DASHBOARD, $flag ? '__return_true' : '__return_false' );
		}
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}
		$info = jetpack_get_module_info( Jetpack_Protect_Dashboard_Feature_Flags::MODULE );
		$to   = $from ? $info['introduced'] : false;

		$this->assertSame( $activates, in_array( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_default_modules( $from, $to ), true ) );
	}

	/**
	 * Activating while the Jetpack Protect plugin is active stores the module without loading it, until that plugin is gone.
	 */
	public function test_hidden_module_is_stored_and_loads_once_the_protect_plugin_is_gone() {
		Constants::set_constant( 'JETPACK_PROTECT_VERSION', '6.1.0' );
		$info = jetpack_get_module_info( Jetpack_Protect_Dashboard_Feature_Flags::MODULE );

		Jetpack::activate_default_modules( '16.4-a.3', $info['introduced'], array(), false, false );

		$this->assertContains( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, (array) Jetpack_Options::get_option( 'active_modules', array() ) );
		$this->assertNotContains( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_active_modules() );

		Constants::clear_single_constant( 'JETPACK_PROTECT_VERSION' );
		$this->assertContains( Jetpack_Protect_Dashboard_Feature_Flags::MODULE, Jetpack::get_active_modules() );
	}

	/**
	 * The constants to set, and whether loading the module file adds the page.
	 *
	 * @return array[]
	 */
	public static function provide_module_loads() {
		return array(
			'without the Jetpack Protect plugin' => array( array(), true ),
			'with the Jetpack Protect plugin'    => array( array( 'JETPACK_PROTECT_VERSION' => '6.1.0' ), false ),
		);
	}

	/**
	 * @dataProvider provide_module_loads
	 *
	 * @param array $constants Constants to set.
	 * @param bool  $adds_page Whether the page's menu item should be hooked.
	 */
	#[DataProvider( 'provide_module_loads' )]
	public function test_module_file_leaves_the_protect_plugin_page_alone( $constants, $adds_page ) {
		foreach ( $constants as $name => $value ) {
			Constants::set_constant( $name, $value );
		}

		include JETPACK__PLUGIN_DIR . 'modules/protect-dashboard.php';

		$this->assertSame( $adds_page, false !== has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) ) );
	}
}
