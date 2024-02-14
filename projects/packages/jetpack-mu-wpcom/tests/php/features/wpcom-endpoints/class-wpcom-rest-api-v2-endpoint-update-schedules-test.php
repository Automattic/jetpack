<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:disable WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-update-schedules.php';

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
		delete_option( 'jetpack_update_schedules' );

		parent::tear_down();
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
		update_option( 'jetpack_update_schedules', array( array( 'hello-dolly/hello-dolly.php' ), $plugins ) );

		// Successful request.
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertEquals(
			array(
				(object) array(
					'hook'      => 'jetpack_scheduled_update',
					'args'      => array( 'hello-dolly/hello-dolly.php' ),
					'timestamp' => strtotime( 'next Tuesday 9:00' ),
					'schedule'  => 'daily',
					'interval'  => DAY_IN_SECONDS,
				),
				(object) array(
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
					'gutenberg/gutenberg.php',
					'custom-plugin/custom-plugin.php',
				),
				'schedule' => array(
					'timestamp' => strtotime( 'next Monday 8:00' ),
					'interval'  => 'weekly',
				),
			)
		);
		$schedule_id = md5( serialize( $request->get_body_params()['plugins'] ) );

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
					'gutenberg/gutenberg.php',
					'custom-plugin/custom-plugin.php',
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
	 * @covers ::create_item_permissions_check
	 */
	public function test_creating_schedules_for_same_time() {
		$plugins = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );
		update_option( 'jetpack_update_schedules', array( $plugins ) );

		// Can't create a schedule for the same time again.
		$request = new WP_REST_Request( 'POST', '/wpcom/v2/update-schedules' );
		$request->set_body_params(
			array(
				'plugins'  => array(
					'gutenberg/gutenberg.php',
					'custom-plugin/custom-plugin.php',
				),
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
	 * @covers ::create_item_permissions_check
	 */
	public function test_creating_more_than_two_schedules() {
		$plugins = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);

		// Create two schedules.
		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );
		wp_schedule_event( strtotime( 'next Tuesday 9:00' ), 'daily', 'jetpack_scheduled_update', $plugins );
		update_option( 'jetpack_update_schedules', array( $plugins, $plugins ) );

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
		$result = rest_do_request( $request );

		$this->assertSame( 403, $result->get_status() );
		$this->assertSame( 'rest_forbidden', $result->get_data()['code'] );
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
		$schedule_id = md5( serialize( $plugins ) );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );
		update_option( 'jetpack_update_schedules', array( $plugins ) );

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
	 * Test update item.
	 *
	 * @covers ::update_item
	 */
	public function test_update_item() {
		$plugins     = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		$schedule_id = md5( serialize( $plugins ) );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );
		update_option( 'jetpack_update_schedules', array( $plugins ) );

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
	 * Test delete item.
	 *
	 * @covers ::delete_item
	 */
	public function test_delete_item() {
		$plugins     = array(
			'gutenberg/gutenberg.php',
			'custom-plugin/custom-plugin.php',
		);
		$schedule_id = md5( serialize( $plugins ) );

		wp_schedule_event( strtotime( 'next Monday 8:00' ), 'weekly', 'jetpack_scheduled_update', $plugins );
		update_option( 'jetpack_update_schedules', array( $plugins ) );

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

		$this->assertEmpty( get_option( 'jetpack_update_schedules' ) );
		$this->assertFalse( wp_get_scheduled_event( 'jetpack_scheduled_update', $plugins ) );
	}
}
