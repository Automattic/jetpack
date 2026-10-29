<?php
/**
 * Tests for the Jetpack Protect plugin class.
 *
 * @package automattic/jetpack-protect-plugin
 */

use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\Protect_Status\Protect_Status;
use Automattic\Jetpack\Protect_Status\Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Jetpack_Protect
 */
#[CoversClass( Jetpack_Protect::class )]
class Jetpack_Protect_Test extends BaseTestCase {

	/**
	 * Sign in an administrator and store a fresh report listing one core vulnerability.
	 */
	public function set_up() {
		parent::set_up();
		require_once ABSPATH . WPINC . '/class-wp-admin-bar.php';
		add_filter(
			'pre_http_request',
			static function () {
				return new WP_Error( 'http_request_blocked', 'Blocked in tests.' );
			}
		);
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);
		update_option(
			Protect_Status::OPTION_NAME,
			(object) array(
				'last_checked' => '2026-10-14 00:00:00',
				'core'         => (object) array(
					'version'         => $GLOBALS['wp_version'],
					'vulnerabilities' => array(
						(object) array(
							'id'    => 'core-1',
							'title' => 'A core vulnerability',
						),
					),
				),
			)
		);
		update_option( Protect_Status::OPTION_TIMESTAMP_NAME, time() + HOUR_IN_SECONDS );
	}

	/**
	 * Leave no filter, count, status or user behind.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_protect_threat_notifications_enabled' );
		remove_all_filters( 'pre_http_request' );
		Notification_Counts::reset();
		Status::$status = null;
		Protect_Status::delete_option();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Whether the host lets threats be announced.
	 *
	 * @return array[]
	 */
	public static function provide_notify_cases() {
		return array(
			'notifications on'  => array( true ),
			'notifications off' => array( false ),
		);
	}

	/**
	 * @dataProvider provide_notify_cases
	 *
	 * @param bool $notify Whether the host lets threats be announced.
	 */
	#[DataProvider( 'provide_notify_cases' )]
	public function test_threat_count_shows_in_menu_and_admin_bar_only_when_the_host_allows( $notify ) {
		if ( ! $notify ) {
			add_filter( 'jetpack_protect_threat_notifications_enabled', '__return_false' );
		}
		$protect   = new Jetpack_Protect();
		$admin_bar = new WP_Admin_Bar();

		$protect->admin_page_init();
		$protect->admin_bar( $admin_bar );

		$this->assertSame( $notify ? 1 : null, Notification_Counts::all()['jetpack-protect']['count'] ?? null );
		$this->assertSame( $notify, null !== $admin_bar->get_node( 'jetpack-protect' ) );
	}

	/**
	 * @dataProvider provide_protect_page_cases
	 *
	 * @param bool $on_protect_page Whether the Protect page is being viewed.
	 */
	#[DataProvider( 'provide_protect_page_cases' )]
	public function test_admin_bar_keeps_a_hidden_node_on_the_protect_page_when_there_are_no_threats( $on_protect_page ) {
		$status                        = get_option( Protect_Status::OPTION_NAME );
		$status->core->vulnerabilities = array();
		update_option( Protect_Status::OPTION_NAME, $status );
		if ( $on_protect_page ) {
			require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
			require_once ABSPATH . 'wp-admin/includes/screen.php';
			set_current_screen( 'toplevel_page_jetpack-protect' );
			$_GET['page'] = 'jetpack-protect';
		}
		$admin_bar = new WP_Admin_Bar();

		( new Jetpack_Protect() )->admin_bar( $admin_bar );
		unset( $_GET['page'], $GLOBALS['current_screen'] );

		$node = $admin_bar->get_node( 'jetpack-protect' );
		$this->assertSame( $on_protect_page, null !== $node );
		if ( $on_protect_page ) {
			$this->assertSame( 'hidden', $node->meta['class'] );
		}
	}

	/**
	 * Whether the Protect page is being viewed.
	 *
	 * @return array[]
	 */
	public static function provide_protect_page_cases() {
		return array(
			'protect page' => array( true ),
			'other page'   => array( false ),
		);
	}
}
