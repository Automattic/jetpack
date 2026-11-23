<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\My_Jetpack\Products\Site_Accelerator;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Unit tests for the Site Accelerator product.
 *
 * @package automattic/my-jetpack
 */
class Site_Accelerator_Product_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
		wp_cache_delete( 'plugins', 'plugins' );

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		Initializer::init();

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		activate_plugins( 'jetpack/jetpack.php' );
		$this->reset_mock_modules();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->reset_mock_modules();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Clears the module state the Jetpack mock keeps in static properties.
	 */
	private function reset_mock_modules() {
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock from ./assets/jetpack-mock-plugin.txt.
		\Jetpack::$active_modules = array();
		// @phan-suppress-next-line PhanUndeclaredStaticProperty
		\Jetpack::$return_false = false;
		// @phan-suppress-next-line PhanUndeclaredStaticProperty
		\Jetpack::$forced_on = array();
		// @phan-suppress-next-line PhanUndeclaredStaticProperty
		\Jetpack::$forced_off = array();
	}

	/**
	 * The status follows the Image CDN and Asset CDN modules.
	 *
	 * @param string[] $active_modules The active modules.
	 * @param string   $expected       The expected product status.
	 * @dataProvider provide_status_cases
	 */
	#[DataProvider( 'provide_status_cases' )]
	public function test_status_follows_cdn_modules( $active_modules, $expected ) {
		// @phan-suppress-next-line PhanUndeclaredStaticProperty -- Declared on the mock from ./assets/jetpack-mock-plugin.txt.
		\Jetpack::$active_modules = $active_modules;

		$this->assertSame( $expected, Site_Accelerator::get_status() );
	}

	/**
	 * Active modules and the status Site Accelerator reports with them.
	 *
	 * @return array[]
	 */
	public static function provide_status_cases() {
		return array(
			'neither'        => array( array(), Products::STATUS_MODULE_DISABLED ),
			'image CDN only' => array( array( 'photon' ), Products::STATUS_ACTIVE ),
			'asset CDN only' => array( array( 'photon-cdn' ), Products::STATUS_ACTIVE ),
			'both'           => array( array( 'photon', 'photon-cdn' ), Products::STATUS_ACTIVE ),
		);
	}

	/**
	 * Activation turns both modules on, and deactivation turns both off.
	 */
	public function test_activate_and_deactivate_switch_both_modules() {
		$this->assertTrue( Site_Accelerator::activate() );
		$this->assertTrue( \Jetpack::is_module_active( 'photon' ) );
		$this->assertTrue( \Jetpack::is_module_active( 'photon-cdn' ) );

		$this->assertTrue( Site_Accelerator::deactivate() );
		$this->assertFalse( \Jetpack::is_module_active( 'photon' ) );
		$this->assertFalse( \Jetpack::is_module_active( 'photon-cdn' ) );
	}
}
