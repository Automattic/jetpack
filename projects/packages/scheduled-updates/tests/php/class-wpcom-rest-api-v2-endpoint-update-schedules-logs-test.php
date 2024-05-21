<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs.
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Logs;

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs.
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Logs_Test extends \WorDBless\BaseTestCase {
	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	public $admin_id;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up_wordbless();
		\WorDBless\Users::init()->clear_all_users();

		// Be sure wordbless cron is reset before each test.
		delete_option( 'cron' );
		update_option( 'cron', array( 'version' => 2 ), 'yes' );

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );

		Scheduled_Updates::init();
	}

	/**
	 * Clean up after test
	 *
	 * @after
	 */
	public function tear_down() {
		wp_delete_user( $this->admin_id );
		parent::tear_down_wordbless();
	}

	/**
	 * Test adding a log entry for a non-existent schedule.
	 *
	 * @covers ::create_item
	 */
	public function test_add_log_invalid_schedule() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) . '/logs' );
		$request->set_body_params(
			array(
				'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'message' => 'Starting plugin updates.',
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertEmpty( get_option( Scheduled_Updates::PLUGIN_CRON_HOOK ) );
	}

	/**
	 * Test retrieving logs.
	 *
	 * @covers ::get_items
	 */
	public function test_get_logs() {
		wp_set_current_user( $this->admin_id );

		$schedule_id = $this->create_test_schedule();

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array(), $result->get_data() );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding a log entry and retrieving it.
	 *
	 * @covers ::create_item
	 * @covers ::get_items
	 */
	public function test_add_and_get_log() {
		wp_set_current_user( $this->admin_id );

		$schedule_id = $this->create_test_schedule();

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
		$request->set_body_params(
			array(
				'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'message' => 'Starting plugin updates.',
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertCount( 1, $result->get_data() );
		$this->assertSame( Scheduled_Updates_Logs::PLUGIN_UPDATES_START, $result->get_data()[0][0]['action'] );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_timestamp );
		$this->assertSame( 'in-progress', $sync_option[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding multiple runs and retrieving them.
	 *
	 * @covers ::create_item
	 * @covers ::get_items
	 */
	public function test_add_and_get_multiple_logs() {
		wp_set_current_user( $this->admin_id );

		$schedule_id = $this->create_test_schedule();

		// Simulate 5 runs.
		for ( $i = 0;$i < 5;$i++ ) {
			$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
			$request->set_body_params(
				array(
					'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
					'message' => 'Starting plugin updates.',
				)
			);
			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );

			$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
			$request->set_body_params(
				array(
					'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS,
					'message' => 'Ending plugin updates.',
				)
			);
			$result = rest_do_request( $request );
			$this->assertSame( 200, $result->get_status() );
		}

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertCount( Scheduled_Updates_Logs::MAX_RUNS_PER_SCHEDULE, $result->get_data() );
		$this->assertSame( Scheduled_Updates_Logs::PLUGIN_UPDATES_START, $result->get_data()[0][0]['action'] );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertNotNull( $sync_option[ $schedule_id ]->last_run_timestamp );
		$this->assertSame( 'success', $sync_option[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding a log when unauthorized.
	 *
	 * @covers ::create_item
	 */
	public function test_add_log_unauthorized() {
		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) . '/logs' );
		$request->set_body_params(
			array(
				'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'message' => 'Starting plugin updates.',
			)
		);
		$result = rest_do_request( $request );
		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Create schedules.
	 *
	 * @param int $i Schedule index.
	 */
	private function create_test_schedule( $i = 1 ) {
		$request           = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$scheduled_plugins = array( 'gutenberg/gutenberg.php', 'installed-plugin/installed-plugin.php' );
		$scheduled_plugins = array_slice( $scheduled_plugins, 0, $i );
		$request->set_body_params(
			array(
				'plugins'  => $scheduled_plugins,
				'schedule' => array(
					'timestamp' => strtotime( "next Monday {$i}:00" ),
					'interval'  => 'weekly',
				),
			)
		);

		$result = rest_do_request( $request );
		return $result->get_data();
	}
}
