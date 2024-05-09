<?php
/**
 * Test class for functions and behavior that runs outside REST API requests.
 *
 * At this point in the test suite, `rest_api_init` has not been called yet, so endpoints are not registered.
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;

/**
 * Test class for behavior that runs outside REST API requests.
 */
class Pre_Rest_Api_Test extends \WorDBless\BaseTestCase {

	/**
	 * Set up.
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up_wordbless();
		Scheduled_Updates::init();
	}

	/**
	 * Test that the scheduled updates option contains all expected data.
	 *
	 * @covers \Automattic\Jetpack\Scheduled_Updates::update_option_cron
	 */
	public function test_update_option_cron() {
		$plugins = array( 'gutenberg/gutenberg.php' );
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins, true );

		$option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$event  = array_pop( $option );

		$this->assertIsObject( $event );

		$this->assertObjectHasProperty( 'hook', $event );
		$this->assertObjectHasProperty( 'timestamp', $event );
		$this->assertObjectHasProperty( 'schedule', $event );
		$this->assertObjectHasProperty( 'args', $event );
		$this->assertObjectHasProperty( 'interval', $event );
		$this->assertObjectHasProperty( 'last_run_timestamp', $event );
		$this->assertObjectHasProperty( 'last_run_status', $event );
		$this->assertObjectHasProperty( 'active', $event );
		$this->assertObjectHasProperty( 'health_check_paths', $event );
	}
}
