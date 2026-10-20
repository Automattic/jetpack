<?php
/**
 * Masterbar Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

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

	/**
	 * Data provider for the admin interface style a site reads.
	 *
	 * @return array<string, array{0: string|null, 1: string|false, 2: string}>
	 */
	public static function provide_admin_interface_styles() {
		return array(
			'never chose'                             => array( null, false, 'wp-admin' ),
			'never chose, read by Settings > General' => array( null, 'calypso', 'wp-admin' ),
			'chose the Default style'                 => array( 'calypso', false, 'calypso' ),
		);
	}

	/**
	 * Tests that a site that never chose an admin interface style reads the Classic style.
	 *
	 * @dataProvider provide_admin_interface_styles
	 *
	 * @param string|null  $saved          The saved style, or null if the site never chose one.
	 * @param string|false $passed_default The default the caller passes.
	 * @param string       $expected       The style the site reads.
	 */
	#[DataProvider( 'provide_admin_interface_styles' )]
	public function test_wpcom_admin_interface_default( $saved, $passed_default, $expected ) {
		// A style in the persistent data store wins over the option, and the WP Cloud test site has one.
		remove_filter( 'pre_option_wpcom_admin_interface', 'wpcomsh_get_wpcom_admin_interface_option' );

		// Added rather than updated, so the change doesn't go out to WordPress.com.
		if ( null !== $saved ) {
			add_option( 'wpcom_admin_interface', $saved );
		}

		$this->assertSame( $expected, get_option( 'wpcom_admin_interface', $passed_default ) );
	}
}
