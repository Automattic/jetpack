<?php
/**
 * Tests for the dashboard's announcements.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Announcements\Announcement_Registry;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Dashboard_Announcements
 */
#[CoversClass( Dashboard_Announcements::class )]
class Dashboard_Announcements_Test extends BaseTestCase {

	/**
	 * Drop the registrant and the registry it hydrated.
	 */
	public function tear_down() {
		remove_all_actions( Announcement_Registry::REGISTER_ACTION );

		$instance = new \ReflectionProperty( Announcement_Registry::class, 'instance' );
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}
		$instance->setValue( null, null );
	}

	public function test_registers_announcements_the_dashboard_surface_asks_for() {
		Dashboard_Announcements::configure();

		$announcements = Announcement_Registry::get_instance()->get_all_registered();

		$this->assertNotEmpty( $announcements );
		foreach ( $announcements as $announcement ) {
			$this->assertContains( Dashboard_Announcements::CONTEXT, $announcement['contexts'] );
		}
	}
}
