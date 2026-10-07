<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Constants;
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

		remove_filter( 'jetpack_active_modules', array( $this, 'activate_protect_dashboard' ) );
		Constants::clear_constants();
	}

	/**
	 * Report the `protect-dashboard` module as active.
	 *
	 * @return string[]
	 */
	public function activate_protect_dashboard() {
		return array( 'protect-dashboard' );
	}

	/**
	 * Whether the module is active, whether the site is WordPress.com Simple, and whether the Protect page is expected.
	 *
	 * @return array[]
	 */
	public static function provide_dashboard_module_states() {
		return array(
			'module active'                 => array( true, false, true ),
			'module inactive'               => array( false, false, false ),
			'module active on WPCOM Simple' => array( true, true, false ),
		);
	}

	/**
	 * Tests Protect Manage URL with the Jetpack plugin's module and no standalone plugin.
	 *
	 * @dataProvider provide_dashboard_module_states
	 *
	 * @param bool $module_active Whether the `protect-dashboard` module is active.
	 * @param bool $is_simple     Whether the site is WordPress.com Simple.
	 * @param bool $expect_page   Whether the manage URL should be the Protect page.
	 */
	#[DataProvider( 'provide_dashboard_module_states' )]
	public function test_protect_manage_url_with_the_dashboard_module( $module_active, $is_simple, $expect_page ) {
		if ( $module_active ) {
			add_filter( 'jetpack_active_modules', array( $this, 'activate_protect_dashboard' ) );
		}
		if ( $is_simple ) {
			Constants::set_constant( 'IS_WPCOM', true );
		}

		$this->assertFalse( Protect::is_standalone_plugin_active() );
		$this->assertSame( $expect_page, admin_url( 'admin.php?page=jetpack-protect' ) === Protect::get_manage_url() );
	}
}
