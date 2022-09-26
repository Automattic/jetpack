<?php
/**
 * Tests functionality in the 3rd-party.php file.
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Modules;

require_once JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php';

/**
 * Class WP_Test_Jetpack_AMP_Support
 */
class WP_Test_Third_Party_Support extends WP_UnitTestCase {

	/**
	 * Clean up tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		parent::tear_down();
	}

	/**
	 * Test that Development Versions are suppressed on Atomic.
	 */
	public function test_atomic_returns_false_on_dev_version() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
		Constants::set_constant( 'JETPACK__VERSION', '10.3-a.1' );
		$this->assertFalse( Jetpack::is_development_version() );
	}

	/**
	 * Test that Development Versions via the Beta plugin are still considered as Development versions.
	 */
	public function test_atomic_returns_true_on_beta_plugin_version() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
		Constants::set_constant( 'JETPACK__VERSION', '10.3-a.1' );
		Constants::set_constant( 'JETPACK__PLUGIN_DIR', '/srv/www/public/wp-content/plugins/jetpack-dev/' );
		$this->assertTrue( Jetpack::is_development_version() );
		Constants::clear_single_constant( 'JETPACK__PLUGIN_DIR' );
	}

	/**
	 * Test that Development Versions via the Beta plugin are still considered as Development versions.
	 */
	public function test_atomic_returns_expected_if_not_on_atomic() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', false );
		Constants::set_constant( 'ATOMIC_SITE_ID', false );
		$this->assertTrue( Jetpack::is_development_version() );

		Constants::set_constant( 'JETPACK__VERSION', '10.3.0' );
		$this->assertFalse( Jetpack::is_development_version() );
	}

	/**
	 * Test that the WAF is not available on Atomic.
	 */
	public function test_atomic_no_waf() {
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
			Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
			$this->assertNotContains( 'waf', ( new Modules() )->get_available() );
	}
}
