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
	 * Modules a test puts on offer.
	 *
	 * @var string[]
	 */
	private $available_modules = array();

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		deactivate_plugins( Protect::$plugin_filename );
		remove_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		remove_filter( 'jetpack_get_available_modules', array( $this, 'offer_jetpack_modules' ), PHP_INT_MAX );
		\Jetpack_Options::delete_option( 'active_modules' );
		delete_option( 'active_plugins' );
	}

	/**
	 * Offer the test's modules without the Jetpack plugin.
	 *
	 * @return string[]
	 */
	public function offer_modules() {
		return $this->available_modules;
	}

	/**
	 * Offer the test's modules with the Jetpack plugin.
	 *
	 * @return array Available modules: slug => version.
	 */
	public function offer_jetpack_modules() {
		return array_fill_keys( $this->available_modules, '1.0' );
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
		$this->available_modules = $available;
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		add_filter( 'jetpack_get_available_modules', array( $this, 'offer_jetpack_modules' ), PHP_INT_MAX );
		\Jetpack_Options::update_option( 'active_modules', $active );

		$this->assertSame( $expected, Protect::is_module_active() );
	}

	/**
	 * Whether the Jetpack plugin is active, the modules on offer, and whether activating Protect then uses the standalone plugin.
	 *
	 * @return array[]
	 */
	public static function provide_standalone_plugin_states() {
		return array(
			'Jetpack plugin offers the page' => array( true, array( 'protect', 'protect-dashboard' ), false ),
			'page not on offer'              => array( true, array( 'protect' ), true ),
			'no Jetpack plugin'              => array( false, array( 'protect', 'protect-dashboard' ), true ),
		);
	}

	/**
	 * @dataProvider provide_standalone_plugin_states
	 *
	 * @param bool     $jetpack   Whether the Jetpack plugin is active.
	 * @param string[] $available Modules on offer.
	 * @param bool     $expected  Whether activation uses the standalone plugin.
	 */
	#[DataProvider( 'provide_standalone_plugin_states' )]
	public function test_activation_uses_the_standalone_plugin_only_without_the_protect_page( $jetpack, $available, $expected ) {
		if ( $jetpack ) {
			$this->activate_jetpack_plugin();
		}
		$this->available_modules = $available;
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		add_filter( 'jetpack_get_available_modules', array( $this, 'offer_jetpack_modules' ), PHP_INT_MAX );

		$this->assertSame( $expected, Protect::should_use_standalone_plugin() );
	}

	/**
	 * An installed but inactive standalone plugin stays off when the Jetpack plugin offers the Protect page.
	 */
	public function test_activate_plugin_leaves_an_inactive_standalone_plugin_off_with_the_protect_page() {
		$this->activate_jetpack_plugin();
		$this->activate_standalone_plugin();
		deactivate_plugins( Protect::$plugin_filename );
		$this->available_modules = array( 'protect', 'protect-dashboard' );
		add_filter( 'jetpack_get_available_standalone_modules', array( $this, 'offer_modules' ) );
		add_filter( 'jetpack_get_available_modules', array( $this, 'offer_jetpack_modules' ), PHP_INT_MAX );

		Protect::activate_plugin();

		$this->assertFalse( Protect::is_standalone_plugin_active() );
	}

	/**
	 * Install and activate a mock of the Jetpack plugin without loading it.
	 */
	private function activate_jetpack_plugin() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		wp_cache_delete( 'plugins', 'plugins' );
		update_option( 'active_plugins', array( 'jetpack/jetpack.php' ) );
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
