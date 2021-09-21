<?php

include( '../feature-plugins/masterbar.php' );

class MasterbarTest extends WP_UnitTestCase {
	public function test_wpcomsh_get_plugin_updated_submenus() {
		$this->assertEquals(
			wpcomsh_is_site_sticker_active( 'wpcom-marketplace' ),
			false
		);
	}
}