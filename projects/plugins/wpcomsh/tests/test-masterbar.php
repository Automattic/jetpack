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
	/**
	 * Test_wpcomsh_get_plugin_updated_submenus.
	 */
	public function test_wpcomsh_get_plugin_updated_submenus() {
		$this->assertEquals(
			wpcomsh_is_site_sticker_active( 'wpcom-marketplace' ),
			false
		);
	}
}
