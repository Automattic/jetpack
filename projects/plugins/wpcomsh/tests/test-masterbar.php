<?php

include( '../feature-plugins/masterbar.php' );

class MasterbarTest extends WP_UnitTestCase {
	public function test_wpcomsh_get_plugin_updated_submenus() {
		$this->assertEquals(
			array(
				'plugin-install.php' => 'https://wordpress.com/plugins/new-domain.wordpress.com'
			),
			wpcomsh_get_plugin_updated_submenus( array(), 'new-domain.wordpress.com' )
		);
		$this->assertEquals(
			array(
				'plugin-install.php' => 'https://wordpress.com/plugins/new-domain.wordpress.com'
			),
			wpcomsh_get_plugin_updated_submenus( array( 'plugin-install.php' => 'https://wordpress.com/plugins/domain.wordpress.com' ), 'new-domain.wordpress.com' )
		);
	}
}