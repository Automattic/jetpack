<?php
require_once __DIR__ . '/../../../../modules/scan/class-admin-bar-notice.php';

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Scan\Admin_Bar_Notice;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * @covers \Automattic\Jetpack\Scan\Admin_Bar_Notice
 */
#[CoversClass( Admin_Bar_Notice::class )]
class Admin_Bar_Notice_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Sign in an administrator on a site where Scan found one threat.
	 */
	public function set_up() {
		parent::set_up();
		require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';
		unset( $GLOBALS['wp_actions']['jetpack_protect_dashboard_initialized'] );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		set_transient( 'jetpack_scan_state', (object) array( 'threats' => array( (object) array( 'id' => 1 ) ) ) );
	}

	/**
	 * Forget the threat and the dashboard.
	 */
	public function tear_down() {
		delete_transient( 'jetpack_scan_state' );
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
			'Jetpack Cloud'     => array( false ),
		);
	}

	/**
	 * @dataProvider provide_dashboard_states
	 *
	 * @param bool $has_dashboard Whether the Protect dashboard loaded.
	 */
	#[DataProvider( 'provide_dashboard_states' )]
	public function test_threats_link_opens_the_protect_dashboard_in_place_or_jetpack_cloud_in_a_new_tab( $has_dashboard ) {
		if ( $has_dashboard ) {
			do_action( 'jetpack_protect_dashboard_initialized' );
		}
		$admin_bar = new WP_Admin_Bar();

		( new Admin_Bar_Notice() )->add_threats_to_toolbar( $admin_bar );

		$node = $admin_bar->get_node( 'jetpack-scan-notice' );
		$url  = $has_dashboard ? admin_url( 'admin.php?page=jetpack-protect' ) : Redirect::get_url( 'calypso-scanner' );
		$this->assertSame( esc_url( $url ), $node->href );
		$this->assertSame( $has_dashboard ? null : '_blank', $node->meta['target'] ?? null );
		$this->assertSame( $has_dashboard ? null : 'noopener noreferrer', $node->meta['rel'] ?? null );
	}
}
