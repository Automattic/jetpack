<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules.
 *
 * @package automattic/scheduled-updates
 */

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

		wp_clear_scheduled_hook( 'jetpack_scheduled_update' );
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
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', 'jetpack_scheduled_update', array( 'hello-dolly/hello-dolly.php' ) );
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );

		// Successful request.
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertEquals(
			array(
				$this->generate_schedule_id( array( 'hello-dolly/hello-dolly.php' ) ) => (object) array(
					'hook'      => 'jetpack_scheduled_update',
					'args'      => array( 'hello-dolly/hello-dolly.php' ),
					'timestamp' => strtotime( 'next Tuesday 9:00' ),
					'schedule'  => 'daily',
					'interval'  => DAY_IN_SECONDS,
				),
				$this->generate_schedule_id( $plugins ) => (object) array(
					'hook'      => 'jetpack_scheduled_update',
					'args'      => $plugins,
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'schedule'  => 'weekly',
					'interval'  => WEEK_IN_SECONDS,
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
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => array(
					'custom-plugin/custom-plugin.php',
					'gutenberg/gutenberg.php',
				),
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);
		$schedule_id = $this->generate_schedule_id( $request->get_body_params()['plugins'] );

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

		// Can't create a schedule for the same time again.
		$request->set_body_params(
			array(
				'plugins'  => array(
					'custom-plugin/custom-plugin.php',
					'gutenberg/gutenberg.php',
				),
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
	 * Can't have multiple schedules for the same time.
	 *
	 * @covers ::validate_schedule
	 */
	public function test_creating_schedules_for_same_time() {
		$plugins = array(
			'custom-plugin/custom-plugin.php',
			'gutenberg/gutenberg.php',
		);

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );

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
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', array( 'gutenberg/gutenberg.php' ) );
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', 'jetpack_scheduled_update', array( 'custom-plugin/custom-plugin.php' ) );

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
	 * Test get item.
	 *
	 * @covers ::get_item
	 */
	public function test_get_item() {
		$plugins     = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		$schedule_id = $this->generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );

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
			(object) array(
				'hook'      => 'jetpack_scheduled_update',
				'args'      => $plugins,
				'timestamp' => strtotime( 'next Monday 8:00' ),
				'schedule'  => 'weekly',
				'interval'  => WEEK_IN_SECONDS,
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

		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/' . $this->generate_schedule_id( array() ) );
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
		$schedule_id = $this->generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );

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
	}

	/**
	 * Test update_item with invalid schedule ID.
	 *
	 * @covers ::update_item
	 */
	public function test_update_invalid_item() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'PUT', '/wpcom/v2/update-schedules/' . $this->generate_schedule_id( array() ) );
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
		$schedule_id = $this->generate_schedule_id( $plugins );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );

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

		$this->assertFalse( wp_get_scheduled_event( 'jetpack_scheduled_update', $plugins ) );
	}

	/**
	 * Test delete_item with invalid schedule ID.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_invalid_item() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( 'DELETE', '/wpcom/v2/update-schedules/' . $this->generate_schedule_id( array() ) );
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

		$schedule_id = $this->generate_schedule_id( $plugins_2 );

		wp_schedule_event( strtotime( 'next Tuesday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins_1 );
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins_2 );

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
	 * Generates a unique schedule ID.
	 *
	 * @see wp_schedule_event()
	 *
	 * @param array $args Schedule arguments.
	 * @return string
	 */
	private function generate_schedule_id( $args ) {
		return md5( serialize( $args ) ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
	}
}
