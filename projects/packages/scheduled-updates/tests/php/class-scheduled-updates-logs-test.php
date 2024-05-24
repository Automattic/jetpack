<?php
/**
 * Test class for Scheduled_Updates_Logs.
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Test class for Scheduled_Updates_Logs.
 *
 * @coversDefaultClass Scheduled_Updates_Logs
 */
class Scheduled_Updates_Logs_Test extends \WorDBless\BaseTestCase {

	/**
	 * Used to mock global functions inside a namespace.
	 *
	 * @see https://github.com/php-mock/php-mock-phpunit
	 */
	use \phpmock\phpunit\PHPMock;

	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	public $admin_id;

	/**
	 * Set up before class.
	 *
	 * @see Restrictions here: https://github.com/php-mock/php-mock-phpunit?tab=readme-ov-file#restrictions
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		static::defineFunctionMock( 'Automattic\Jetpack', 'realpath' );
	}

	/**
	 * Set up.
	 *
	 * @before
	 */
	protected function set_up() {
		parent::set_up_wordbless();
		\WorDBless\Users::init()->clear_all_users();

		// Be sure wordbless cron is reset before each test.
		delete_option( 'cron' );
		update_option( 'cron', array( 'version' => 2 ), 'yes' );

		// Initialize the admin.
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dumasdasdasmy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->admin_id );
		Scheduled_Updates::init();
	}

	/**
	 * Clean up after test
	 *
	 * @after
	 */
	protected function tear_down() {
		delete_option( Scheduled_Updates_Logs::OPTION_NAME );
		parent::tear_down_wordbless();
	}

	/**
	 * Test logging events and retrieving logs for a specific schedule ID.
	 *
	 * @covers ::log
	 * @covers ::get
	 */
	public function test_log_and_get_logs() {
		$schedule_id = $this->create_schedule( 1 );

		// Test logging events.
		Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates' );
		Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATE_SUCCESS, 'Plugin updated successfully', array( 'plugin' => 'test-plugin' ) );
		Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS, 'Plugin updates completed' );

		// Test retrieving logs.
		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		// Assert that logs are split into runs correctly.
		$this->assertCount( 1, $logs );
		$this->assertCount( 3, $logs[0] );

		// Assert log entry values.
		$this->assertEquals( Scheduled_Updates_Logs::PLUGIN_UPDATES_START, $logs[0][0]['action'] );
		$this->assertEquals( 'Starting plugin updates', $logs[0][0]['message'] );
		$this->assertEquals( Scheduled_Updates_Logs::PLUGIN_UPDATE_SUCCESS, $logs[0][1]['action'] );
		$this->assertEquals( 'Plugin updated successfully', $logs[0][1]['message'] );
		$this->assertEquals( array( 'plugin' => 'test-plugin' ), $logs[0][1]['context'] );
		$this->assertEquals( Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS, $logs[0][2]['action'] );
		$this->assertEquals( 'Plugin updates completed', $logs[0][2]['message'] );
	}

	/**
	 * Test that only the last MAX_RUNS_PER_SCHEDULE runs are kept when logging events.
	 *
	 * @covers ::log
	 * @covers ::get
	 */
	public function test_max_runs_per_schedule() {
		$schedule_id = $this->create_schedule( 1 );

		// Log events for more than MAX_RUNS_PER_SCHEDULE.
		for ( $i = 1; $i <= Scheduled_Updates_Logs::MAX_RUNS_PER_SCHEDULE + 1; $i++ ) {
			Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, "Starting plugin updates (Run $i)" );
			Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS, "Plugin updates completed (Run $i)" );
		}

		// Test retrieving logs.
		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		// Assert that only the last MAX_RUNS_PER_SCHEDULE runs are kept.
		$this->assertCount( Scheduled_Updates_Logs::MAX_RUNS_PER_SCHEDULE, $logs );
		$this->assertEquals( 'Starting plugin updates (Run 2)', $logs[0][0]['message'] );
		$this->assertEquals( 'Plugin updates completed (Run 2)', $logs[0][1]['message'] );
		$this->assertEquals( 'Starting plugin updates (Run 3)', $logs[1][0]['message'] );
		$this->assertEquals( 'Plugin updates completed (Run 3)', $logs[1][1]['message'] );
	}

	/**
	 * Test logging to a non-existent schedule ID.
	 *
	 * @covers ::get
	 */
	public function test_log_non_existent_schedule() {
		$schedule_id = 'non_existent_schedule';

		// Test retrieving logs for a non-existent schedule.
		$result = Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates' );

		// Assert that nothing was logged.
		$this->assertFalse( $result );
		$this->assertArrayNotHasKey( $schedule_id, get_option( Scheduled_Updates_Logs::OPTION_NAME, array() ) );
	}

	/**
	 * Test retrieving logs for a non-existent schedule ID.
	 *
	 * @covers ::get
	 */
	public function test_get_logs_non_existent_schedule() {
		$schedule_id = 'non_existent_schedule';

		// Test retrieving logs for a non-existent schedule.
		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		// Assert that an empty array is returned.
		$this->assertIsArray( $logs );
		$this->assertEmpty( $logs );
	}

	/**
	 * Test retrieving logs for multiple schedules.
	 *
	 * @covers ::log
	 * @covers ::get
	 */
	public function test_get_all_logs() {
		$schedule_id_1 = $this->create_schedule( 1 );
		$schedule_id_2 = $this->create_schedule( 2 );

		// Log events for multiple schedules.
		Scheduled_Updates_Logs::log( $schedule_id_1, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates for schedule 1' );
		Scheduled_Updates_Logs::log( $schedule_id_1, Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS, 'Plugin updates completed for schedule 1' );
		Scheduled_Updates_Logs::log( $schedule_id_2, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates for schedule 2' );
		Scheduled_Updates_Logs::log( $schedule_id_2, Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS, 'Plugin updates completed for schedule 2' );

		// Test retrieving all logs.
		$all_logs = Scheduled_Updates_Logs::get();

		// Assert that logs for both schedules are returned.
		$this->assertArrayHasKey( $schedule_id_1, $all_logs );
		$this->assertArrayHasKey( $schedule_id_2, $all_logs );
		$this->assertCount( 1, $all_logs[ $schedule_id_1 ] );
		$this->assertCount( 1, $all_logs[ $schedule_id_2 ] );
		$this->assertEquals( 'Starting plugin updates for schedule 1', $all_logs[ $schedule_id_1 ][0][0]['message'] );
		$this->assertEquals( 'Plugin updates completed for schedule 1', $all_logs[ $schedule_id_1 ][0][1]['message'] );
		$this->assertEquals( 'Starting plugin updates for schedule 2', $all_logs[ $schedule_id_2 ][0][0]['message'] );
		$this->assertEquals( 'Plugin updates completed for schedule 2', $all_logs[ $schedule_id_2 ][0][1]['message'] );
	}

	/**
	 * Test clearing logs for a specific schedule ID and clearing all logs.
	 *
	 * @covers ::log
	 * @covers ::clear
	 * @covers ::get
	 */
	public function test_clear_logs() {
		$schedule_id_1 = $this->create_schedule( 1 );
		$schedule_id_2 = $this->create_schedule( 2 );

		// Log events for multiple schedules.
		Scheduled_Updates_Logs::log( $schedule_id_1, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates for schedule 1' );
		Scheduled_Updates_Logs::log( $schedule_id_2, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates for schedule 2' );

		// Clear logs for a specific schedule.
		Scheduled_Updates_Logs::clear( $schedule_id_1 );

		// Test retrieving logs after clearing.
		$logs_schedule_1 = Scheduled_Updates_Logs::get( $schedule_id_1 );
		$logs_schedule_2 = Scheduled_Updates_Logs::get( $schedule_id_2 );

		// Assert that logs for the cleared schedule are empty.
		$this->assertEmpty( $logs_schedule_1 );
		// Assert that logs for the other schedule are still present.
		$this->assertNotEmpty( $logs_schedule_2 );

		// Clear all logs.
		Scheduled_Updates_Logs::clear();

		// Test retrieving all logs after clearing.
		$all_logs = Scheduled_Updates_Logs::get();

		// Assert that all logs are empty.
		$this->assertEmpty( $all_logs );
	}

	/**
	 * Test clearing logs for a non-existent schedule ID.
	 *
	 * @covers ::get
	 */
	public function test_clear_logs_non_existent_schedule() {
		$schedule_id = 'non_existent_schedule';

		// Test clearing logs for a non-existent schedule.
		Scheduled_Updates_Logs::clear( $schedule_id );

		// Assert that there's no log for the non-existent schedule.
		$this->assertArrayNotHasKey( $schedule_id, get_option( Scheduled_Updates_Logs::OPTION_NAME ) );
	}

	/**
	 * Test deleting logs after scheduled update deletion.
	 *
	 * @covers ::get
	 */
	public function test_delete_logs_after_scheduled_update_deletion() {
		$schedule_id = $this->create_schedule( 1 );

		Scheduled_Updates_Logs::log( $schedule_id, Scheduled_Updates_Logs::PLUGIN_UPDATES_START, 'Starting plugin updates' );

		// Test retrieving logs.
		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		$this->assertCount( 1, $logs );
		$this->assertCount( 1, $logs[0] );

		$request = new \WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data() );

		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		$this->assertIsArray( $logs );
		$this->assertEmpty( $logs );

		$schedule_id = $this->create_schedule( 1 );

		$logs = Scheduled_Updates_Logs::get( $schedule_id );

		// New schedule with same plugins of an old schedule should not have the same logs.
		$this->assertCount( 0, $logs );
	}

	/**
	 * Create schedule
	 *
	 * @param int $i Schedule index.
	 */
	private function create_schedule( $i = 0 ) {
		$request           = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$scheduled_plugins = array( 'gutenberg/gutenberg.php', 'installed-plugin/installed-plugin.php' );
		$scheduled_plugins = array_slice( $scheduled_plugins, 0, $i );
		$request->set_body_params(
			array(
				'plugins'            => $scheduled_plugins,
				'schedule'           => array(
					'timestamp' => strtotime( "next Monday {$i}:00" ),
					'interval'  => 'weekly',
				),
				'health_check_paths' => array(),
			)
		);

		$result = rest_do_request( $request );
		return $result->get_data();
	}
}
