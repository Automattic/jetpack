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
	 * @var array
	 */
	public static $sync_counters = array();

	/**
	 * Scheduled counter.
	 *
	 * @var int
	 */
	public static $scheduled_counter = 0;

	/**
	 * Number of transients added.
	 *
	 * @var int
	 */
	public static $transients_added = 0;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up_wordbless();
		\WorDBless\Users::init()->clear_all_users();

		// Be sure wordbless cron is reset before each test.
		delete_option( 'cron' );
		update_option( 'cron', array( 'version' => 2 ), 'yes' );

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

		Scheduled_Updates::init();

		// Start sync count.
		add_action( 'added_option', array( __CLASS__, 'sync_add_callback' ) );
		add_action( 'updated_option', array( __CLASS__, 'sync_update_callback' ) );
		add_filter( 'pre_schedule_event', array( __CLASS__, 'pre_schedule_callback' ), 10, 0 );
		add_filter( 'pre_set_transient_pre_schedule_event_clear_cron_cache', array( __CLASS__, 'pre_set_transient_callback' ), 10, 0 );
		self::$sync_counters     = array();
		self::$scheduled_counter = 0;
		self::$transients_added  = 0;
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

		// End sync count.
		remove_action( 'added_option', array( __CLASS__, 'sync_add_callback' ) );
		remove_action( 'updated_option', array( __CLASS__, 'sync_update_callback' ) );
		remove_filter( 'pre_schedule_event', array( __CLASS__, 'pre_schedule_callback' ) );
		self::$sync_counters     = array();
		self::$scheduled_counter = 0;
		self::$transients_added  = 0;
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
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$this->assertSame( 0, self::get_sync_counter() );
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', Scheduled_Updates::PLUGIN_CRON_HOOK, array( 'hello-dolly/hello-dolly.php' ) );
		$this->assertSame( 1, self::get_sync_counter() );
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

		$this->assertSame( 2, self::get_sync_counter() );
		$this->assertSame( 2, self::$scheduled_counter );
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
		$this->assertSame( 1, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 2, self::get_sync_counter() );
		$this->assertSame( 2, self::$scheduled_counter );
		$this->assertSame( 2, self::$transients_added );
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
		$this->assertSame( 1, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
	}

	/**
	 * Can't submit a schedule without plugins parameter.
	 *
	 * @covers ::register_routes
	 */
	public function test_creating_schedule_without_plugins_parameter() {
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params( array( 'schedule' => $this->get_schedule() ) );

		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_missing_callback_param', $result->get_data()['code'] );
		$this->assertSame( 0, self::$transients_added );
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
		$this->assertSame( 1, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 1, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 0, self::get_sync_counter() );
		$this->assertSame( 0, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
	}

	/**
	 * Test get item.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item() {
		$plugins     = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
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
		$this->assertSame( 1, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
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
		$this->assertSame( 0, self::get_sync_counter() );
		$this->assertSame( 0, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
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
		$this->assertSame( 2, self::get_sync_counter() );
		$this->assertSame( 2, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 1, self::get_sync_counter() );

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
		$this->assertSame( 3, self::get_sync_counter() );

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
			$this->assertSame( 4, self::get_sync_counter() );
			$this->assertSame( 2, self::$scheduled_counter );
			$this->assertSame( 1, self::$transients_added );
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
				'plugins'  => array( 'gutenberg/gutenberg.php' ),
				'schedule' => $this->get_schedule( 'next Tuesday 9:00', 'daily' ),
			)
		);
		$result = rest_do_request( $request );

		$this->assertSame( 404, $result->get_status() );
		$this->assertSame( 'rest_invalid_schedule', $result->get_data()['code'] );
		$this->assertSame( 0, self::get_sync_counter() );
		$this->assertSame( 0, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
	}

	/**
	 * Test delete item.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_item() {
		$plugins     = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins );
		$this->assertSame( 1, self::get_sync_counter() );

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
		$this->assertSame( 1, self::get_sync_counter() );

		// Successful request.
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertTrue( $result->get_data() );

		$this->assertFalse( wp_get_scheduled_event( Scheduled_Updates::PLUGIN_CRON_HOOK, $plugins ) );

		$sync_option = get_option( Scheduled_Updates::PLUGIN_CRON_HOOK );
		$this->assertSame( array(), $sync_option );
		$this->assertSame( 2, self::get_sync_counter() );
		$this->assertSame( 1, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 0, self::get_sync_counter() );
		$this->assertSame( 0, self::$scheduled_counter );
		$this->assertSame( 0, self::$transients_added );
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
		$this->assertSame( 2, self::get_sync_counter() );

		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		wp_set_current_user( $this->admin_id );
		rest_do_request( $request );

		$this->assertSame( $expected_result, get_option( 'auto_update_plugins' ) );
		$this->assertSame( 3, self::get_sync_counter() );
		$this->assertSame( 2, self::$scheduled_counter );
		$this->assertSame( 1, self::$transients_added );
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
		$this->assertSame( 1, self::get_sync_counter() );

		// Read.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( 200, $result->get_status() );
		$this->assertIsArray( $data );
		$this->assertSame( $base_schedule['timestamp'], $data['timestamp'] );
		// No sync during read.
		$this->assertSame( 1, self::get_sync_counter() );

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
		$this->assertSame( 2, self::get_sync_counter() );

		// Read again.
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );
		$data    = $result->get_data();

		$this->assertSame( $base_schedule['timestamp'], $data['timestamp'] );
		// No sync during read.
		$this->assertSame( 2, self::get_sync_counter() );

		// Delete.
		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $schedule_id );
		$result  = rest_do_request( $request );

		$this->assertTrue( $result->get_data() );
		// One sync during delete.
		$this->assertSame( 3, self::get_sync_counter() );
		$this->assertSame( 2, self::$scheduled_counter );
		$this->assertSame( 3, self::$transients_added );
	}

	/**
	 * A staging environment must be blocked.
	 *
	 * @covers ::create_item
	 * @covers ::update_item
	 * @covers ::delete_item
	 */
	public function test_crud_should_be_blocked_on_staging() {
		update_option( 'wpcom_is_staging_site', true );
		wp_set_current_user( $this->admin_id );

		$plugins     = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);
		$schedule_id = Scheduled_Updates::generate_schedule_id( $plugins );
		$request     = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => $plugins,
				'schedule' => $this->get_schedule(),
			)
		);

		// Create.
		$result = rest_do_request( $request );
		$this->assertSame( 403, $result->get_status() );

		// Update.
		$request->set_method( 'PUT' );
		$request->set_route( '/wpcom/v2/update-schedules/' . $schedule_id );
		$result = rest_do_request( $request );
		$this->assertSame( 403, $result->get_status() );

		// Delete.
		$request->set_method( 'DELETE' );
		$request->set_route( '/wpcom/v2/update-schedules/' . $schedule_id );
		$result = rest_do_request( $request );
		$this->assertSame( 403, $result->get_status() );

		delete_option( 'wpcom_is_staging_site' );
	}

	/**
	 * A callback run when an option is added.
	 *
	 * @param string $option Name of the added option.
	 */
	public static function sync_add_callback( $option ) {
		self::add_sync_count( 'add_' . $option );
	}

	/**
	 * A callback run when an option is updated.
	 *
	 * @param string $option Name of the updated option.
	 */
	public static function sync_update_callback( $option ) {
		self::add_sync_count( 'update_' . $option );
	}

	/**
	 * Add to the sync counter.
	 *
	 * @param string $name Name of the sync counter.
	 */
	public static function add_sync_count( $name ) {
		if ( ! array_key_exists( $name, self::$sync_counters ) ) {
			self::$sync_counters[ $name ] = 0;
		}

		++self::$sync_counters[ $name ];
	}

	/**
	 * Get the sync counter.
	 */
	public static function get_sync_counter() {
		$added   = self::$sync_counters[ 'add_' . Scheduled_Updates::PLUGIN_CRON_HOOK ] ?? 0;
		$updated = self::$sync_counters[ 'update_' . Scheduled_Updates::PLUGIN_CRON_HOOK ] ?? 0;

		return $added + $updated;
	}

	/**
	 * Callback of pre_schedule_event filter.
	 */
	public static function pre_schedule_callback() {
		++self::$scheduled_counter;

		return null;
	}

	/**
	 * Callback of pre_set_transient filter.
	 */
	public static function pre_set_transient_callback() {
		++self::$transients_added;
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
