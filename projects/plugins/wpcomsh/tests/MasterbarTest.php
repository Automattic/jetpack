<?php
/**
 * Masterbar Test file.
 *
 * @package wpcomsh
 */

/**
 * Class MasterbarTest.
 */
class MasterbarTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test_wpcomsh_get_plugin_updated_submenus.
	 */
	public function test_wpcomsh_get_plugin_updated_submenus() {
		$this->assertFalse( wpcomsh_is_site_sticker_active( 'wpcom-marketplace' ) );
	}
}
