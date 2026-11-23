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

	public function test_registers_announcements_the_dashboard_surface_asks_for() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		$this->log_in_user_registered( '2020-01-01 00:00:00' );
		Dashboard_Announcements::configure();

		$announcements = Announcement_Registry::get_instance()->get_all_registered();

		$this->assertNotEmpty( $announcements );
		foreach ( $announcements as $announcement ) {
			foreach ( $announcement['channels'] as $channel ) {
				$this->assertTrue(
					Dashboard_Announcements::CHANNEL === $channel || 0 === strpos( $channel, Dashboard_Announcements::CHANNEL . '/' ),
					"No page of the dashboard subscribes to the channel {$channel}."
				);
			}
			$this->assertSame( Capabilities::VIEW_ANALYTICS, $announcement['capability'] );
		}
	}

	public function test_registers_nothing_older_than_the_user() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		$this->log_in_user_registered( '2099-01-01 00:00:00' );
		Dashboard_Announcements::configure();

		$this->assertSame( array(), Announcement_Registry::get_instance()->get_all_registered() );
	}

	public function test_registers_nothing_while_the_flag_is_off() {
		$this->log_in_user_registered( '2020-01-01 00:00:00' );
		Dashboard_Announcements::configure();

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
}
