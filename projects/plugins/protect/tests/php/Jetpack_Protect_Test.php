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
		unset( $_GET['page'], $GLOBALS['current_screen'] );
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
	 * Whether `?page=jetpack-protect` is requested in wp-admin or on the front end.
	 *
	 * @return array[]
	 */
	public static function provide_protect_page_contexts() {
		return array(
			'wp-admin'  => array( true ),
			'front end' => array( false ),
		);
	}

	/**
	 * @dataProvider provide_protect_page_contexts
	 *
	 * @param bool $in_admin Whether the request is in wp-admin.
	 */
	#[DataProvider( 'provide_protect_page_contexts' )]
	public function test_admin_bar_keeps_a_hidden_node_only_on_the_protect_admin_page_when_there_are_no_threats( $in_admin ) {
		$status                        = get_option( Protect_Status::OPTION_NAME );
		$status->core->vulnerabilities = array();
		update_option( Protect_Status::OPTION_NAME, $status );
		$_GET['page'] = 'jetpack-protect';
		if ( $in_admin ) {
			set_current_screen( 'toplevel_page_jetpack-protect' );
		}
		$admin_bar = new WP_Admin_Bar();

		( new Jetpack_Protect() )->admin_bar( $admin_bar );

		$node = $admin_bar->get_node( 'jetpack-protect' );
		$this->assertSame( $in_admin ? 'hidden' : null, $node ? $node->meta['class'] : null );
	}
}
