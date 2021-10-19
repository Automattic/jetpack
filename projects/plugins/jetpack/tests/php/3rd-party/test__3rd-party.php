<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tests functionality in the 3rd-party.php file.
 */

use Automattic\Jetpack\Constants;

require_once JETPACK__PLUGIN_DIR . '3rd-party/3rd-party.php';

/**
 * Class WP_Test_Jetpack_AMP_Support
 */
class WP_Test_Third_Party_Support extends WP_UnitTestCase {

	/**
	 * Test that Development Versions are suppressed on Atomic.
	 */
	public function test_atomic_returns_false_on_dev_version() {
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 999 );
		Constants::set_constant( 'ATOMIC_SITE_ID', 999 );
		Constants::set_constant( 'JETPACK__VERSION', '10.3-a.1' );

		$this->assertFalse( Jetpack::is_development_version() );

		Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
	}

}
