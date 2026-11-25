<?php
/**
 * Tests for the dashboard's announcements.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Announcements\Announcement_Registry;
use Automattic\Jetpack\Feature_Flags\Feature_Flags;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\Users as WorDBless_Users;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Dashboard_Announcements
 */
#[CoversClass( Dashboard_Announcements::class )]
class Dashboard_Announcements_Test extends BaseTestCase {

	/**
	 * Drop the flag, the registrant, the registry it hydrated and the users.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG );
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );
		Feature_Flags::reset();

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );

		wp_set_current_user( 0 );
		WorDBless_Users::init()->clear_all_users();

		parent::tear_down();
	}

	/**
	 * Log in a user registered on a given date.
	 *
	 * @param string $registered Registration date, as `Y-m-d H:i:s`.
	 */
	private function log_in_user_registered( $registered ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login'      => 'a_reader',
					'user_pass'       => 'password',
					'user_registered' => $registered,
				)
			)
		);
	}

	/**
	 * Hook a registrant of the dashboard that has one announcement, of June 2026.
	 */
	private function hook_a_registrant_with_an_announcement() {
		$registrant = new class() extends Dashboard_Announcements {
			/**
			 * One announcement, on the main page of the dashboard.
			 *
			 * @return array[]
			 */
			protected static function get_announcements() {
				return array(
					'stats/a-feature' => array(
						'date'     => '2026-06-01',
						'title'    => 'A feature',
						'channels' => array( self::CHANNEL . '/main' ),
					),
				);
			}
		};

		add_action( Announcement_Registry::REGISTER_ACTION, array( $registrant, 'register' ) );
	}

	public function test_registers_an_announcement_for_whoever_can_read_the_dashboard() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		$this->log_in_user_registered( '2020-01-01 00:00:00' );
		$this->hook_a_registrant_with_an_announcement();

		$announcements = Announcement_Registry::get_instance()->get_all_registered();

		$this->assertSame( array( 'stats/a-feature' ), array_keys( $announcements ) );
		$this->assertSame( Capabilities::VIEW_ANALYTICS, $announcements['stats/a-feature']['capability'] );
	}

	public function test_registers_nothing_older_than_the_user() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		$this->log_in_user_registered( '2099-01-01 00:00:00' );
		$this->hook_a_registrant_with_an_announcement();

		$this->assertSame( array(), Announcement_Registry::get_instance()->get_all_registered() );
	}

	public function test_registers_nothing_while_the_flag_is_off() {
		$this->log_in_user_registered( '2020-01-01 00:00:00' );
		$this->hook_a_registrant_with_an_announcement();

		$this->assertSame( array(), Announcement_Registry::get_instance()->get_all_registered() );
	}

	/**
	 * @param bool $enabled Whether the flag is on.
	 * @dataProvider provide_flag_states
	 */
	#[DataProvider( 'provide_flag_states' )]
	public function test_tells_the_client_whether_to_mount_the_surface( $enabled ) {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, $enabled ? '__return_true' : '__return_false' );
		Dashboard_Announcements::configure();

		$data = apply_filters( 'jetpack_admin_js_script_data', array() );

		$this->assertSame( $enabled, $data['premium_analytics']['whats_new_enabled'] );
	}

	/**
	 * Data for test_tells_the_client_whether_to_mount_the_surface.
	 *
	 * @return array
	 */
	public static function provide_flag_states() {
		return array(
			'flag off' => array( false ),
			'flag on'  => array( true ),
		);
	}

	public function test_publishes_its_own_announcements_where_a_page_of_the_dashboard_shows_them() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		$this->log_in_user_registered( '2020-01-01 00:00:00' );
		Dashboard_Announcements::configure();

		$this->assertSame( 10, has_action( Announcement_Registry::REGISTER_ACTION, array( Dashboard_Announcements::class, 'register' ) ) );

		$strays = array();
		foreach ( Announcement_Registry::get_instance()->get_all_registered() as $id => $announcement ) {
			foreach ( $announcement['channels'] as $channel ) {
				if ( Dashboard_Announcements::CHANNEL !== $channel && 0 !== strpos( $channel, Dashboard_Announcements::CHANNEL . '/' ) ) {
					$strays[] = "{$id} on {$channel}";
				}
			}
		}

		$this->assertSame( array(), $strays, 'No page of the dashboard subscribes to these channels.' );
	}
}
