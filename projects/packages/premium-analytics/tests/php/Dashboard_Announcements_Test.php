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

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Dashboard_Announcements
 */
#[CoversClass( Dashboard_Announcements::class )]
class Dashboard_Announcements_Test extends BaseTestCase {

	/**
	 * Drop the flag, the registrant and the registry it hydrated.
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

		parent::tear_down();
	}

	public function test_registers_announcements_the_dashboard_surface_asks_for() {
		add_filter( 'jetpack_feature_flag_enabled_' . Dashboard_Announcements::FLAG, '__return_true' );
		Dashboard_Announcements::configure();

		$announcements = Announcement_Registry::get_instance()->get_all_registered();

		$this->assertNotEmpty( $announcements );
		foreach ( $announcements as $announcement ) {
			$this->assertContains( Dashboard_Announcements::CHANNEL, $announcement['channels'] );
		}
	}

	public function test_registers_nothing_while_the_flag_is_off() {
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
