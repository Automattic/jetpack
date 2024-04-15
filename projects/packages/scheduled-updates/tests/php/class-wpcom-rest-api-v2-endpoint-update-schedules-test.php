<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules.
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;
use Automattic\Jetpack\Scheduled_Updates_Logs;

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules.
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Update_Schedules
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Test extends \WorDBless\BaseTestCase {
	/**
	 * Admin user ID.
	 *
	 * @var int
	 */
	public $admin_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	public $editor_id;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		new WPCOM_REST_API_V2_Endpoint_Update_Schedules();
	}

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id  = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_editor',
				'user_pass'  => 'dummy_pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );

		do_action( 'rest_api_init' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		parent::tear_down();

		wp_delete_user( $this->admin_id );
		wp_delete_user( $this->editor_id );

		wp_clear_scheduled_hook( Scheduled_Updates::PLUGIN_CRON_HOOK );
		delete_option( 'jetpack_scheduled_update_statuses' );
	}

	/**
	 * Test get_items.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items() {
		// Unauthenticated request.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Not the right permissions.
		wp_set_current_user( $this->editor_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		// No schedules.
		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array(), $result->get_data() );

		// Set up some schedules.
		$plugins = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, array( 'hello-dolly/hello-dolly.php' ) );
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		// Successful request.
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertEquals(
			array(
				Scheduled_Updates::generate_schedule_id( array( 'hello-dolly/hello-dolly.php' ) ) => array(
					'hook'               => Scheduled_Updates::PLUGIN_CRON_HOOK,
					'args'               => array( 'hello-dolly/hello-dolly.php' ),
					'timestamp'          => strtotime( 'next Tuesday 9:00' ),
					'schedule'           => 'daily',
					'interval'           => DAY_IN_SECONDS,
					'last_run_timestamp' => null,
					'last_run_status'    => null,
				),
				Scheduled_Updates::generate_schedule_id( $plugins ) => array(
					'hook'               => Scheduled_Updates::PLUGIN_CRON_HOOK,
					'args'               => $plugins,
					'timestamp'          => strtotime( 'next Monday 8:00' ),
					'schedule'           => 'weekly',
					'interval'           => WEEK_IN_SECONDS,
					'last_run_timestamp' => null,
					'last_run_status'    => null,
				),
			),
			$result->get_data()
		);
	}

	/**
	 * Test create item.
	 *
	 * @covers ::create_item
	 */
	public function test_create_item() {
		$plugins = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $request->get_body_params()['plugins'] );

		// Unauthenticated request.
		$result = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Not the right permissions.
		wp_set_current_user( $this->editor_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertIsObject( $callable_result[ $schedule_id ] );
		$this->assertSame( $plugins, $callable_result[ $schedule_id ]->args );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_status );

		// Can't create a schedule for the same time again.
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
	}

	/**
	 * Test create multiple item.
	 *
	 * @covers ::create_item
	 */
	public function test_create_multiple_item() {
		$plugins = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $request->get_body_params()['plugins'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertIsObject( $callable_result[ $schedule_id ] );
		$this->assertSame( $plugins, $callable_result[ $schedule_id ]->args );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_status );

		$plugins[] = 'wp-test-plugin/wp-test-plugin.php';
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 10:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		$schedule_id_2 = Scheduled_Updates::generate_schedule_id( $request->get_body_params()['plugins'] );
		$result        = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id_2, $result->get_data() );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertIsObject( $callable_result[ $schedule_id ] );
		$this->assertIsObject( $callable_result[ $schedule_id_2 ] );
	}

	/**
	 * Can't have multiple schedules for the same time.
	 *
	 * @covers ::validate_schedule
	 */
	public function test_creating_schedules_for_same_time() {
		$plugins = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		// Can't create a schedule for the same time again.
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
	}

	/**
	 * Can't have more than two schedules.
	 *
	 * @covers ::validate_schedule
	 */
	public function test_creating_more_than_two_schedules() {
		// Create two schedules.
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, array( 'gutenberg/gutenberg.php' ) );
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, array( 'custom-plugin/custom-plugin.php' ) );

		// Number 3.
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => array(
					'gutenberg/gutenberg.php',
					'custom-plugin/custom-plugin.php',
				),
				'schedule' => array(
					'timestamp' => strtotime( 'next Wednesday 10:00' ),
					'interval'  => 'daily',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
	}

	/**
	 * Removes plugins from the autoupdate list when creating a schedule.
	 *
	 * @covers ::create_item
	 */
	public function test_updating_autoupdate_plugins_on_create() {
		$unscheduled_plugins = array( 'hello-dolly/hello-dolly.php' );
		$plugins             = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);

		update_option( 'auto_update_plugins', array( 'hello-dolly/hello-dolly.php', 'gutenberg/gutenberg.php' ) );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		rest_do_request( $request );

		$this->assertEquals( $unscheduled_plugins, get_option( 'auto_update_plugins' ) );
	}

	/**
	 * Can't have more than two schedules.
	 *
	 * @covers ::create
	 */
	public function test_empty_last_run() {
		$plugins = array( 'gutenberg/gutenberg.php' );
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Wednesday 10:00' ),
					'interval'  => 'daily',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertEquals(
			array(
				Scheduled_Updates::generate_schedule_id( $plugins ) => array(
					'hook'               => Scheduled_Updates::PLUGIN_CRON_HOOK,
					'args'               => $plugins,
					'timestamp'          => strtotime( 'next Wednesday 10:00' ),
					'schedule'           => 'daily',
					'interval'           => DAY_IN_SECONDS,
					'last_run_timestamp' => null,
					'last_run_status'    => null,
				),
			),
			$result->get_data()
		);
	}

	/**
	 * Update event status.
	 *
	 * @covers ::update_status
	 */
	public function test_update_event_status() {
		$plugins = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$id_1    = Scheduled_Updates::generate_schedule_id( $plugins );
		$body    = array(
			'last_run_timestamp' => 1,
			'last_run_status'    => 'success',
		);

		wp_schedule_event( strtotime( 'next Tuesday 0:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules/' . $id_1 . '/status' );
		$request->set_body_params( $body );

		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules/abc/status' );
		$request->set_body_params( $body );
		$result = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules/' . $id_1 . '/status' );
		$request->set_body_params( $body );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 1, $result->get_data()['last_run_timestamp'] );
		$this->assertSame( 'success', $result->get_data()['last_run_status'] );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$events = $result->get_data();

		$this->assertIsArray( $events );
		$this->assertArrayHasKey( $id_1, $events );
		$this->assertSame( 1, $events[ $id_1 ]['last_run_timestamp'] );
		$this->assertSame( 'success', $events[ $id_1 ]['last_run_status'] );

		$plugins = array(
			'hello-dolly/hello.php',
		);
		$id_2    = Scheduled_Updates::generate_schedule_id( $plugins );
		$body    = array(
			'last_run_timestamp' => 2,
			'last_run_status'    => 'failure-and-rollback',
		);

		wp_schedule_event( strtotime( 'next Tuesday 09:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules/' . $id_2 . '/status' );
		$request->set_body_params( $body );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );

		$events = $result->get_data();

		$this->assertArrayHasKey( $id_1, $events );
		$this->assertSame( 1, $events[ $id_1 ]['last_run_timestamp'] );
		$this->assertArrayHasKey( $id_2, $events );
		$this->assertSame( 2, $events[ $id_2 ]['last_run_timestamp'] );
		$this->assertSame( 'success', $events[ $id_1 ]['last_run_status'] );
		$this->assertSame( 'failure-and-rollback', $events[ $id_2 ]['last_run_status'] );
	}

	/**
	 * Include over 10 plugins when creating a schedule.
	 *
	 * @covers ::create_item
	 */
	public function test_creating_schedule_with_more_than_ten_plugins() {
		$plugins = array(
			'plugin-1/plugin-1.php',
			'plugin-2/plugin-2.php',
			'plugin-3/plugin-3.php',
			'plugin-4/plugin-4.php',
			'plugin-5/plugin-5.php',
			'plugin-6/plugin-6.php',
			'plugin-7/plugin-7.php',
			'plugin-8/plugin-8.php',
			'plugin-9/plugin-9.php',
			'plugin-10/plugin-10.php',
			'plugin-11/plugin-11.php',
		);

		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );
		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_invalid_param', $result->get_data()['code'] );
	}

	/**
	 * Test get item.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item() {
		$plugins     = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		// Unauthenticated request.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Not the right permissions.
		wp_set_current_user( $this->editor_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertEquals(
			array(
				'hook'               => Scheduled_Updates::PLUGIN_CRON_HOOK,
				'args'               => $plugins,
				'timestamp'          => strtotime( 'next Monday 8:00' ),
				'schedule'           => 'weekly',
				'interval'           => WEEK_IN_SECONDS,
				'last_run_timestamp' => null,
				'last_run_status'    => null,
			),
			$result->get_data()
		);
	}

	/**
	 * Test get_item with invalid schedule ID.
	 *
	 * @covers ::get_item
	 */
	public function test_get_invalid_item() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) );
		$result  = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'rest_invalid_schedule', $result->get_data()['code'] );
	}

	/**
	 * Test update item.
	 *
	 * @covers ::update_item
	 */
	public function test_update_item() {
		$plugins     = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		// Unauthenticated request.
		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Tuesday 9:00' ),
					'interval'  => 'daily',
				),
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Not the right permissions.
		wp_set_current_user( $this->editor_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertIsObject( $callable_result[ $schedule_id ] );
		$this->assertSame( $plugins, $callable_result[ $schedule_id ]->args );
	}

	/**
	 * Test update item.
	 *
	 * @covers ::update_item
	 */
	public function test_update_item_with_status() {
		$plugins   = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$timestamp = strtotime( 'last Monday 8:00' );
		$status    = 'success';

		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		Scheduled_Updates::set_scheduled_update_status( $schedule_id, $timestamp, $status );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => array(
					'timestamp' => strtotime( 'next Tuesday 9:00' ),
					'interval'  => 'daily',
				),
			)
		);

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$schedule_id = $result->get_data();

		// Get the updated status
		$updated_status = Scheduled_Updates::get_scheduled_update_status( $schedule_id );
		if ( $updated_status === null ) {
			$this->fail( 'Scheduled_Updates::get_scheduled_update_status() returned null.' );
		} else {
			$this->assertIsArray( $updated_status, 'Scheduled_Updates::get_scheduled_update_status() should return an array.' );
			// doing these null checks for the static analyzer
			$this->assertSame( $timestamp, $updated_status['last_run_timestamp'] ?? null );
			$this->assertSame( $status, $updated_status['last_run_status'] ?? null );

			$callable_result = Scheduled_Updates::get_scheduled_updates();
			$this->assertIsArray( $callable_result );
			$this->assertIsObject( $callable_result[ $schedule_id ] );
			$this->assertSame( $plugins, $callable_result[ $schedule_id ]->args );
			$this->assertSame( $timestamp, $callable_result[ $schedule_id ]->last_run_timestamp );
			$this->assertSame( $status, $callable_result[ $schedule_id ]->last_run_status );
		}
	}

	/**
	 * Test update_item with invalid schedule ID.
	 *
	 * @covers ::update_item
	 */
	public function test_update_invalid_item() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) );
		$request->set_body_params(
			array(
				'plugins'  => array(),
				'schedule' => array(
					'timestamp' => strtotime( 'next Tuesday 9:00' ),
					'interval'  => 'daily',
				),
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'rest_invalid_schedule', $result->get_data()['code'] );
	}

	/**
	 * Test delete item.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_item() {
		$plugins     = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );

		// Unauthenticated request.
		wp_set_current_user( 0 );
		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Not the right permissions.
		wp_set_current_user( $this->editor_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data() );

		$this->assertFalse( wp_get_scheduled_event( Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins ) );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertSame( array(), $callable_result );
	}

	/**
	 * Test delete_item with invalid schedule ID.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_invalid_item() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) );
		$result  = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'rest_invalid_schedule', $result->get_data()['code'] );
	}

	/**
	 * Adds plugins to the autoupdate list when deleting a schedule.
	 *
	 * @covers ::delete_item
	 */
	public function test_updating_autoupdate_plugins_on_delete() {
		$auto_update = array( 'hello-dolly/hello-dolly.php' );
		$plugins_1   = array( 'custom-plugin/custom-plugin.php' );
		$plugins_2   = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);

		// Existing auto-update list and deleted plugins that are not part of other schedules.
		$expected_result = array(
			'gutenberg/gutenberg.php',
			'hello-dolly/hello-dolly.php',
		);

		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins_2 );

		wp_schedule_event( strtotime( 'next Tuesday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins_1 );
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins_2 );

		update_option( 'auto_update_plugins', $auto_update );

		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		wp_set_current_user( $this->admin_id );
		rest_do_request( $request );

		$this->assertSame( $expected_result, get_option( 'auto_update_plugins' ) );
	}

	/**
	 * Make sure unauthorized users can't get in to capabilities.
	 *
	 * @covers ::get_capabilities
	 */
	public function test_non_admin_user_capabilities() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/capabilities' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Make sure authorized users can see data for capabilities
	 *
	 * @covers ::get_capabilities
	 */
	public function test_admin_user_capabilities() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/capabilities' );
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
	}

	/**
	 * Test adding a log entry.
	 *
	 * @covers ::add_log
	 */
	public function test_add_log() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . Scheduled_Updates::generate_schedule_id( array() ) . '/logs' );
		$request->set_body_params(
			array(
				'action'  => Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
				'message' => 'Starting plugin updates.',
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array(), Scheduled_Updates::get_scheduled_updates() );
	}

	/**
	 * Test retrieving logs
	 *
	 * @covers ::add_log
	 */
	public function test_get_logs() {
		wp_set_current_user( $this->admin_id );

		$schedule_id = $this->create_test_schedule();

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id . '/logs' );
		$result  = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array(), $result->get_data() );

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding a log entry and retrieving it
	 *
	 * @covers ::add_log
	 * @covers ::get_logs
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

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertIsArray( $callable_result );
		$this->assertNull( $callable_result[ $schedule_id ]->last_run_timestamp );
		$this->assertSame( 'in-progress', $callable_result[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding multiple runs and retrieving them
	 *
	 * @covers ::add_log
	 * @covers ::get_logs
	 */
	public function test_add_and_get_multiple_logs() {
		wp_set_current_user( $this->admin_id );

		$schedule_id = $this->create_test_schedule();

		// Simulate 5 runs
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

		$callable_result = Scheduled_Updates::get_scheduled_updates();
		$this->assertNotNull( $callable_result[ $schedule_id ]->last_run_timestamp );
		$this->assertSame( 'success', $callable_result[ $schedule_id ]->last_run_status );
	}

	/**
	 * Test adding a log when unauthorized
	 *
	 * @covers ::add_log
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
	 * Create schedule
	 *
	 * @param int $i Schedule index.
	 */
	private function create_test_schedule( $i = 0 ) {
		$request           = new \WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$scheduled_plugins = array( 'test/test' . $i . '.php' );
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
