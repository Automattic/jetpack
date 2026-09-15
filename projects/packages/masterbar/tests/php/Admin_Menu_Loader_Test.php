<?php
/**
 * Tests for admin menu selection.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Hosting and support-session constants require a fresh process per case.
 *
 * @covers ::Automattic\Jetpack\Masterbar\get_admin_menu_class
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversFunction( 'Automattic\Jetpack\Masterbar\get_admin_menu_class' )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Admin_Menu_Loader_Test extends TestCase {
	/**
	 * Test menu selection from site and sticker state.
	 *
	 * @dataProvider menu_state_provider
	 * @param string $platform Hosting platform.
	 * @param array  $stickers Active site stickers.
	 * @param bool   $support_session Whether staff are in a support session.
	 * @param bool   $domain_only Whether the Simple site is domain-only.
	 * @param string $expected_class Expected menu class.
	 */
	#[DataProvider( 'menu_state_provider' )]
	public function test_selects_menu_for_site_state( $platform, $stickers, $support_session, $domain_only, $expected_class ) {
		define( 'IS_WPCOM', 'simple' === $platform );
		define( 'WPCOM_SUPPORT_SESSION', $support_session );
		if ( 'atomic' === $platform ) {
			define( 'ATOMIC_SITE_ID', 123 );
			define( 'ATOMIC_CLIENT_ID', 1 );
			define( 'WPCOMSH__PLUGIN_FILE', __FILE__ );
		}

		Functions\when( 'get_blog_option' )->justReturn( array( 'is_domain_only' => $domain_only ) );
		$sticker_reader = 'atomic' === $platform ? 'wpcomsh_is_site_sticker_active' : 'has_blog_sticker';
		Functions\when( $sticker_reader )->alias(
			static function ( $sticker ) use ( $stickers ) {
				return in_array( $sticker, $stickers, true );
			}
		);

		// Avoid constructing a menu at file load; this test owns selection only.
		add_filter( 'jetpack_admin_menu_class', '__return_empty_string' );
		require __DIR__ . '/../../src/admin-menu/load.php';

		$this->assertSame( $expected_class, get_admin_menu_class() );
	}

	/**
	 * Site states and their expected menus.
	 *
	 * @return array
	 */
	public static function menu_state_provider() {
		return array(
			'simple awaiting content'   => array( 'simple', array( 'difm-lite-in-progress', 'difm-lite-awaiting-content' ), false, false, DIFM_Lite_Admin_Menu::class ),
			'atomic awaiting content'   => array( 'atomic', array( 'difm-lite-in-progress', 'difm-lite-awaiting-content' ), false, false, DIFM_Lite_Admin_Menu::class ),
			'simple submitted'          => array( 'simple', array( 'difm-lite-in-progress' ), false, false, Domain_Only_Admin_Menu::class ),
			'atomic submitted'          => array( 'atomic', array( 'difm-lite-in-progress' ), false, false, Domain_Only_Admin_Menu::class ),
			'simple orphaned awaiting'  => array( 'simple', array( 'difm-lite-awaiting-content' ), false, false, WPcom_Admin_Menu::class ),
			'atomic orphaned awaiting'  => array( 'atomic', array( 'difm-lite-awaiting-content' ), false, false, Atomic_Admin_Menu::class ),
			'simple without a build'    => array( 'simple', array(), false, false, WPcom_Admin_Menu::class ),
			'atomic without a build'    => array( 'atomic', array(), false, false, Atomic_Admin_Menu::class ),
			'simple support session'    => array( 'simple', array( 'difm-lite-in-progress', 'difm-lite-awaiting-content' ), true, false, WPcom_Admin_Menu::class ),
			'atomic support session'    => array( 'atomic', array( 'difm-lite-in-progress', 'difm-lite-awaiting-content' ), true, false, Atomic_Admin_Menu::class ),
			'domain only with stickers' => array( 'simple', array( 'difm-lite-in-progress', 'difm-lite-awaiting-content' ), false, true, Domain_Only_Admin_Menu::class ),
			'domain only without build' => array( 'simple', array(), false, true, Domain_Only_Admin_Menu::class ),
		);
	}
}
