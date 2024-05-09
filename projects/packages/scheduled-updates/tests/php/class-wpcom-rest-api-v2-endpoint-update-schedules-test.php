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
	 * Sync counter.
	 *
	 * @var int
	 */
	public static $sync_counter;

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
		add_filter( 'jetpack_scheduled_update_verify_plugins', '__return_true', 11 );

		Scheduled_Updates::init();

		self::$sync_counter = 0;
		add_action( 'add_option', array( __CLASS__, 'sync_callback' ) );
		add_action( 'update_option', array( __CLASS__, 'sync_callback' ) );
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
		delete_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		remove_filter( 'jetpack_scheduled_update_verify_plugins', '__return_true', 11 );

		self::$sync_counter = 0;
		remove_action( 'add_option', array( __CLASS__, 'sync_callback' ) );
		remove_action( 'update_option', array( __CLASS__, 'sync_callback' ) );
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
					'health_check_paths' => array(),
					'active'             => true,
				),
				Scheduled_Updates::generate_schedule_id( $plugins ) => array(
					'hook'               => Scheduled_Updates::PLUGIN_CRON_HOOK,
					'args'               => $plugins,
					'timestamp'          => strtotime( 'next Monday 8:00' ),
					'schedule'           => 'weekly',
					'interval'           => WEEK_IN_SECONDS,
					'last_run_timestamp' => null,
					'last_run_status'    => null,
					'health_check_paths' => array(),
					'active'             => true,
				),
			),
			$result->get_data()
		);
		$this->assertSame( 2, self::$sync_counter );
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
				'schedule' => $this->get_schedule(),
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

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertIsObject( $sync_option[ $schedule_id ] );
		$this->assertSame( $plugins, $sync_option[ $schedule_id ]->args );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_status );

		// Can't create a schedule for the same time again.
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $this->get_schedule(),
			)
		);

		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
		$this->assertSame( 1, self::$sync_counter );
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
				'schedule' => $this->get_schedule(),
			)
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertIsObject( $sync_option[ $schedule_id ] );
		$this->assertSame( $plugins, $sync_option[ $schedule_id ]->args );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_timestamp );
		$this->assertNull( $sync_option[ $schedule_id ]->last_run_status );

		$plugins[] = 'wp-test-plugin/wp-test-plugin.php';
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $this->get_schedule( 'next Monday 10:00' ),
			)
		);

		$schedule_id_2 = Scheduled_Updates::generate_schedule_id( $request->get_body_params()['plugins'] );
		$result        = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id_2, $result->get_data() );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertIsObject( $sync_option[ $schedule_id ] );
		$this->assertIsObject( $sync_option[ $schedule_id_2 ] );
		$this->assertSame( 2, self::$sync_counter );
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
				'schedule' => $this->get_schedule(),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
		$this->assertSame( 1, self::$sync_counter );
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
				'schedule' => $this->get_schedule(),
			)
		);

		wp_set_current_user( $this->admin_id );
		rest_do_request( $request );

		$this->assertEquals( $unscheduled_plugins, get_option( 'auto_update_plugins' ) );
		$this->assertSame( 1, self::$sync_counter );
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
					'timestamp'          => strtotime( 'next Wednesday 10:00' ),
					'interval'           => 'daily',
					'health_check_paths' => array(),
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
					'health_check_paths' => array(),
					'active'             => true,
				),
			),
			$result->get_data()
		);
		$this->assertSame( 1, self::$sync_counter );
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
				'schedule' => $this->get_schedule(),
			)
		);

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );
		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_invalid_param', $result->get_data()['code'] );
		$this->assertSame( 0, self::$sync_counter );
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
				'health_check_paths' => array(),
				'active'             => true,
			),
			$result->get_data()
		);
		$this->assertSame( 1, self::$sync_counter );
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
		$this->assertSame( 0, self::$sync_counter );
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
				'schedule' => $this->get_schedule( 'next Tuesday 9:00', 'daily' ),
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

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertIsArray( $sync_option );
		$this->assertIsObject( $sync_option[ $schedule_id ] );
		$this->assertSame( $plugins, $sync_option[ $schedule_id ]->args );
		$this->assertSame( 2, self::$sync_counter );
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
		$this->assertSame( 1, self::$sync_counter );

		// Log a start and success.
		Scheduled_Updates_Logs::log(
			$schedule_id,
			Scheduled_Updates_Logs::PLUGIN_UPDATES_START,
			'no_plugins_to_update',
			null,
			$timestamp
		);
		Scheduled_Updates_Logs::log(
			$schedule_id,
			Scheduled_Updates_Logs::PLUGIN_UPDATES_SUCCESS,
			'no_plugins_to_update',
			null,
			$timestamp
		);
		$this->assertSame( 3, self::$sync_counter );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $this->get_schedule( 'next Tuesday 9:00', 'daily' ),
			)
		);

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$schedule_id = $result->get_data();

		// Get the updated status.
		$updated_status = Scheduled_Updates::get_scheduled_update_status( $schedule_id );

		if ( $updated_status === false ) {
			$this->fail( 'Scheduled_Updates::get_scheduled_update_status() returned false.' );
		} else {
			$this->assertIsArray( $updated_status, 'Scheduled_Updates::get_scheduled_update_status() should return an array.' );
			// doing these null checks for the static analyzer.
			$this->assertSame( $timestamp, $updated_status['last_run_timestamp'] ?? null );
			$this->assertSame( $status, $updated_status['last_run_status'] ?? null );

			$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
			$this->assertIsArray( $sync_option );
			$this->assertIsObject( $sync_option[ $schedule_id ] );
			$this->assertSame( $plugins, $sync_option[ $schedule_id ]->args );
			$this->assertSame( $timestamp, $sync_option[ $schedule_id ]->last_run_timestamp );
			$this->assertSame( $status, $sync_option[ $schedule_id ]->last_run_status );
			$this->assertSame( 4, self::$sync_counter );
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
				'schedule' => $this->get_schedule( 'next Tuesday 9:00', 'daily' ),
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'rest_invalid_schedule', $result->get_data()['code'] );
		$this->assertSame( 0, self::$sync_counter );
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
		$this->assertSame( 1, self::$sync_counter );

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
		$this->assertSame( 1, self::$sync_counter );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data() );

		$this->assertFalse( wp_get_scheduled_event( Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins ) );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertSame( array(), $sync_option );
		$this->assertSame( 2, self::$sync_counter );
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
		$this->assertSame( 0, self::$sync_counter );
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
		$this->assertSame( 2, self::$sync_counter );

		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		wp_set_current_user( $this->admin_id );
		rest_do_request( $request );

		$this->assertSame( $expected_result, get_option( 'auto_update_plugins' ) );
		$this->assertSame( 3, self::$sync_counter );
	}

	/**
	 * A CRUD cycle should sync only three times.
	 *
	 * @covers ::create_item
	 * @covers ::get_item
	 * @covers ::update_item
	 * @covers ::delete_item
	 */
	public function test_crud_should_sync_only_three_times() {
		wp_set_current_user( $this->admin_id );
		$plugins       = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$request       = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$base_schedule = $this->get_schedule();
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $base_schedule,
			)
		);

		// Create.
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );
		$result      = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );
		// First sync.
		$this->assertSame( 1, self::$sync_counter );

		// Read.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( 200, $result->get_status() );
		$this->assertIsArray( $data );
		$this->assertSame( $base_schedule['timestamp'], $data['timestamp'] );
		// No sync during read.
		$this->assertSame( 1, self::$sync_counter );

		// Update.
		$request       = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $schedule_id );
		$base_schedule = $this->get_schedule( 'next Monday 9:00' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $base_schedule,
			)
		);

		$result = rest_do_request( $request );
		$data   = $result->get_data();

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $schedule_id, $result->get_data() );

		// Count here should be 2 despite the fact that the schedule is deleted and added.
		$this->assertSame( 2, self::$sync_counter );

		// Read again.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( $base_schedule['timestamp'], $data['timestamp'] );
		// No sync during read.
		$this->assertSame( 2, self::$sync_counter );

		// Delete.
		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );

		$this->assertTrue( $result->get_data() );
		// One sync during delete.
		$this->assertSame( 3, self::$sync_counter );
	}

	/**
	 * A callback run when a sync is performed.
	 *
	 * @param string $option Option name.
	 */
	public static function sync_callback( $option ) {
		if ( Scheduled_Updates::PLUGIN_CRON_HOOK === $option ) {
			++self::$sync_counter;
		}
	}

	/**
	 * Get a schedule.
	 *
	 * @param string $timestamp Schedule timestamp.
	 * @param string $interval Schedule interval.
	 * @param array  $health_check_paths Health check paths.
	 * @return array
	 */
	private function get_schedule( $timestamp = 'next Monday 8:00', $interval = 'weekly', $health_check_paths = array() ) {
		return array(
			'timestamp'          => strtotime( $timestamp ),
			'interval'           => $interval,
			'health_check_paths' => $health_check_paths,
		);
	}
}
