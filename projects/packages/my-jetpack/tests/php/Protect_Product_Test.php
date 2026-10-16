<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Protect;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Protect product.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Protect
 */
class Protect_Product_Test extends TestCase {

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		deactivate_plugins( Protect::$plugin_filename );
	}

	/**
	 * Modules on offer, modules switched on, whether the standalone plugin is active, and whether Protect then counts as switched on.
	 *
	 * @return array[]
	 */
	public static function provide_module_states() {
		return array(
			'page on offer, login protection off' => array( array( 'protect', 'protect-dashboard' ), array( 'protect-dashboard' ), false, true ),
			'page on offer and off'               => array( array( 'protect', 'protect-dashboard' ), array( 'protect' ), false, false ),
			'page not on offer'                   => array( array( 'protect' ), array( 'protect' ), false, true ),
			'page on offer, standalone plugin'    => array( array( 'protect', 'protect-dashboard' ), array( 'protect' ), true, true ),
		);
	}

	/**
	 * @dataProvider provide_module_states
	 *
	 * @param string[] $available  Modules on offer.
	 * @param string[] $active     Modules switched on.
	 * @param bool     $standalone Whether the standalone plugin is active.
	 * @param bool     $expected   Whether Protect counts as switched on.
	 */
	#[DataProvider( 'provide_module_states' )]
	public function test_protect_follows_the_protect_page_module_when_offered( $available, $active, $standalone, $expected ) {
		if ( $standalone ) {
			$this->activate_standalone_plugin();
		}
		$offer         = static function () use ( $available ) {
			return $available;
		};
		$jetpack_offer = static function () use ( $available ) {
			return array_fill_keys( $available, '1.0' );
		};
		add_filter( 'jetpack_get_available_standalone_modules', $offer );
		add_filter( 'jetpack_get_available_modules', $jetpack_offer, PHP_INT_MAX );
		\Jetpack_Options::update_option( 'active_modules', $active );

		$is_active = Protect::is_module_active();

		remove_filter( 'jetpack_get_available_standalone_modules', $offer );
		remove_filter( 'jetpack_get_available_modules', $jetpack_offer, PHP_INT_MAX );
		\Jetpack_Options::delete_option( 'active_modules' );
		$this->assertSame( $expected, $is_active );
	}

	/**
	 * Install and activate a mock of the standalone Protect plugin.
	 */
	private function activate_standalone_plugin() {
		$plugin_dir = WP_PLUGIN_DIR . '/' . Protect::$plugin_slug;
		if ( ! file_exists( $plugin_dir ) ) {
			mkdir( $plugin_dir, 0777, true );
		}
		copy( __DIR__ . '/assets/protect-mock-plugin.txt', $plugin_dir . '/jetpack-protect.php' );
		wp_cache_delete( 'plugins', 'plugins' );
		activate_plugins( Protect::$plugin_slug . '/jetpack-protect.php' );
	}

	/**
	 * Whether the Protect package's dashboard has loaded.
	 *
	 * @return array[]
	 */
	public static function provide_dashboard_states() {
		return array(
			'dashboard loaded'     => array( true ),
			'dashboard not loaded' => array( false ),
		);
	}

	/**
	 * Tests Protect Manage URL with the Protect package's dashboard and no standalone plugin.
	 *
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $loaded Whether the dashboard has loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_protect_manage_url_with_the_dashboard( $loaded ) {
		if ( $loaded ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}

		$this->assertFalse( Protect::is_standalone_plugin_active() );
		$this->assertSame( $loaded, admin_url( 'admin.php?page=jetpack-protect' ) === Protect::get_manage_url() );
		$info = Protect::get_info();
		$this->assertSame( $loaded, $info['has_protect_page'] );
		$this->assertSame( $loaded, admin_url( 'admin.php?page=jetpack-protect' ) === $info['scan_results_url'] );
	}
}
