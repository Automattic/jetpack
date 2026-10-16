<?php
require_once __DIR__ . '/../../../../modules/scan/class-admin-sidebar-link.php';

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Scan\Admin_Sidebar_Link;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Scan\Admin_Sidebar_Link
 */
#[CoversClass( Admin_Sidebar_Link::class )]
class Admin_Sidebar_Link_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Start from an empty menu on a site with Scan.
	 */
	public function set_up() {
		parent::set_up();
		Admin_Menu::reset();
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		set_transient( 'jetpack_scan_state', (object) array( 'state' => 'idle' ) );
		set_transient( 'jetpack_rewind_state', (object) array( 'state' => 'active' ) );
	}

	/**
	 * Leave no menu items, Scan state or dashboard behind.
	 */
	public function tear_down() {
		Admin_Menu::reset();
		delete_transient( 'jetpack_scan_state' );
		delete_transient( 'jetpack_rewind_state' );
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		parent::tear_down();
	}

	/**
	 * Whether the Protect dashboard loaded.
	 *
	 * @return array[]
	 */
	public static function provide_dashboard_states() {
		return array(
			'Protect dashboard' => array( true ),
			'no Protect page'   => array( false ),
		);
	}

	/**
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $has_dashboard Whether the Protect dashboard loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_scan_item_is_added_only_without_a_protect_page( $has_dashboard ) {
		if ( $has_dashboard ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}

		( new Admin_Sidebar_Link() )->maybe_add_admin_link();

		$item = Admin_Menu::remove_menu( esc_url( Redirect::get_url( 'cloud-scan-history-wp-menu' ) ) );
		$this->assertSame( ! $has_dashboard, is_array( $item ) );
	}
}
