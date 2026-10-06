<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\My_Jetpack\Products\Protect;
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
	 * Tests Protect Manage URL with the Jetpack plugin's module and no standalone plugin.
	 */
	public function test_protect_manage_url_with_the_dashboard_module() {
		add_filter( 'jetpack_active_modules', array( $this, 'activate_protect_dashboard' ) );

		$this->assertFalse( Protect::is_standalone_plugin_active() );
		$this->assertSame( admin_url( 'admin.php?page=jetpack-protect' ), Protect::get_manage_url() );
	}
}
