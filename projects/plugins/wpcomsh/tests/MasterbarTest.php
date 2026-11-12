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

	public function test_plugin_install_redirect_runs_on_the_installer_screen() {
		$this->assertSame( 10, has_action( 'load-plugin-install.php', 'wpcomsh_maybe_redirect_plugin_install_to_calypso' ) );
	}

	public function test_plugin_install_with_query_stays_in_wp_admin() {
		$this->use_admin_interface( 'calypso', true );

		$this->assertNull( wpcomsh_get_plugin_install_calypso_url( true ) );
	}

	public function test_bare_plugin_install_goes_to_calypso() {
		$this->use_admin_interface( 'calypso', true );

		$this->assertSame(
			'https://wordpress.com/plugins/' . ( new Automattic\Jetpack\Status() )->get_site_suffix(),
			wpcomsh_get_plugin_install_calypso_url( false )
		);
	}

	public function test_bare_plugin_install_stays_in_wp_admin_on_classic_interface() {
		$this->use_admin_interface( 'wp-admin', true );

		$this->assertNull( wpcomsh_get_plugin_install_calypso_url( false ) );
	}

	public function test_bare_plugin_install_stays_in_wp_admin_without_sso() {
		$this->use_admin_interface( 'calypso', false );

		$this->assertNull( wpcomsh_get_plugin_install_calypso_url( false ) );
	}

	/**
	 * Sets the site's admin interface style and whether Jetpack SSO is active.
	 *
	 * @param string $admin_interface The admin interface style: 'calypso' (Default) or 'wp-admin' (Classic).
	 * @param bool   $sso_active      Whether the SSO module is active.
	 */
	private function use_admin_interface( $admin_interface, $sso_active ) {
		if ( ! class_exists( 'Jetpack' ) ) {
			$this->markTestSkipped( 'Needs the Jetpack plugin for its SSO module.' );
		}

		add_filter(
			'pre_option_wpcom_admin_interface',
			static function () use ( $admin_interface ) {
				return $admin_interface;
			},
			PHP_INT_MAX
		);
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) use ( $sso_active ) {
				$modules = array_diff( (array) $modules, array( 'sso' ) );
				return $sso_active ? array_merge( $modules, array( 'sso' ) ) : array_values( $modules );
			},
			PHP_INT_MAX
		);
	}
}
