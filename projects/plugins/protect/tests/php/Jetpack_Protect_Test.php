<?php
/**
 * Tests for the Jetpack Protect plugin class.
 *
 * @package automattic/jetpack-protect-plugin
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\Protect\Dashboard;
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
		( new Connection_Manager() )->reset_connection_status();
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_connection_cases
	 *
	 * @param bool $connected Whether the site is connected.
	 */
	#[DataProvider( 'provide_connection_cases' )]
	public function test_protect_page_comes_from_the_shared_dashboard_once_connected( $connected ) {
		if ( $connected ) {
			Jetpack_Options::update_option( 'id', 123 );
			Jetpack_Options::update_option( 'blog_token', 'blog.token' );
		}
		( new Connection_Manager() )->reset_connection_status();
		remove_all_actions( 'admin_menu' );

		$protect = new Jetpack_Protect();

		$this->assertSame( $connected ? 999 : false, has_action( 'admin_menu', array( Dashboard::class, 'add_menu' ) ) );
		$this->assertSame( $connected ? false : 10, has_action( '_admin_menu', array( $protect, 'admin_page_init' ) ) );
	}

	/**
	 * Whether the site is connected.
	 *
	 * @return array[]
	 */
	public static function provide_connection_cases() {
		return array(
			'connected'     => array( true ),
			'not connected' => array( false ),
		);
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
}
