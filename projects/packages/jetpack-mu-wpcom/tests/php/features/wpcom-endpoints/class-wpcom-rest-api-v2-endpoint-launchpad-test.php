<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Launchpad.
 *
 * @package automattic/jetpack-mu-wpcom
 */

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-endpoints/class-wpcom-rest-api-v2-endpoint-launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Launchpad.
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Launchpad
 */
class WPCOM_REST_API_V2_Endpoint_Launchpad_Test extends \WorDBless\BaseTestCase {
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
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( 0 );
		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Test get_data.
	 *
	 * @covers ::get_data
	 */
	public function test_get_data() {
		wp_set_current_user( $this->admin_id );

		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/launchpad' );
		$result  = rest_do_request( $request );

		$this->assertEquals( 200, $result->get_status() );

		$this->assertFalse( $result->get_data()['site_intent'] );
		$this->assertFalse( $result->get_data()['launchpad_screen'] );
		$this->assertEmpty( $result->get_data()['checklist_statuses'] );
		$this->assertIsArray( $result->get_data()['checklist_statuses'] );
		$this->assertFalse( $result->get_data()['is_dismissed'] );
	}

	/**
	 * Test can_access.
	 *
	 * @covers ::can_access
	 */
	public function test_can_access() {
		// GET.
		$request = new WP_REST_Request( Requests::GET, '/wpcom/v2/launchpad' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );

		// POST.
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Test updating checklist dismissed state.
	 */
	public function test_update_checklist_dismissed_state() {
		wp_set_current_user( $this->admin_id );

		$values = array(
			'slug'         => 'intent-build',
			'is_dismissed' => true,
		);
		$data   = array( 'is_checklist_dismissed' => $values );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );

		$this->assertFalse( wpcom_launchpad_is_task_list_dismissed( 'intent-build' ) );

		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'updated' => array() ), $result->get_data() );
		$this->assertTrue( wpcom_launchpad_is_task_list_dismissed( 'intent-build' ) );
	}

	/**
	 * Test return not dismissed task list when the date is in the future.
	 */
	public function test_update_checklist_set_temporary_dismissed_when_date_is_in_the_future() {
		wp_set_current_user( $this->admin_id );

		$values = array(
			'slug'       => 'intent-build',
			'dismiss_by' => '+ 1 day',
		);

		$data    = array( 'is_checklist_dismissed' => $values );
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );
		$result = rest_do_request( $request );
		$this->assertSame( 200, $result->get_status(), 'assert status code' );
		$this->assertTrue( wpcom_launchpad_is_task_list_dismissed( 'intent-build' ), 'assert the dismiss state' );
	}

	/**
	 * Test return not dismissed task list when the date is in the future.
	 */
	public function test_update_checklist_doesnt_set_temporary_dismiss_with_invalid_args() {
		wp_set_current_user( $this->admin_id );

		$values = array(
			'slug'       => 'intent-build',
			'dismiss_by' => '+1 century',
		);

		$data    = array( 'is_checklist_dismissed' => $values );
		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );
		$result = rest_do_request( $request );
		$this->assertSame( 400, $result->get_status(), 'assert status code' );
	}

	/**
	 * Test updating checklist_statuses.
	 *
	 * @covers ::update_site_options
	 */
	public function test_update_checklist_statuses() {
		wp_set_current_user( $this->admin_id );

		$values = array(
			'domain_upsell_deferred' => true,
			'site_launched'          => false,
		);
		$data   = array( 'checklist_statuses' => $values );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );

		$this->assertFalse( get_option( 'launchpad_checklist_tasks_statuses' ) );

		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'updated' => array( 'checklist_statuses' => $values ) ), $result->get_data() );

		// The API returns the requested true|false value, but we only store true values.
		$option_value = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertIsArray( $option_value );
		foreach ( $values as $task_id => $task_status ) {
			if ( $task_status ) {
				$this->assertTrue( isset( $option_value[ $task_id ] ), "Task ID $task_id has been stored" );
				$this->assertTrue( $option_value[ $task_id ] );
			} else {
				$this->assertFalse( isset( $option_value[ $task_id ] ) );
			}
		}

		// Mark all tasks as incomplete.
		$values = array(
			'domain_upsell_deferred' => false,
			'site_launched'          => false,
		);
		$data   = array( 'checklist_statuses' => $values );

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );

		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( array( 'updated' => array( 'checklist_statuses' => $values ) ), $result->get_data() );

		// Expect the option to have been deleted.
		$option_value = get_option( 'launchpad_checklist_tasks_statuses' );
		$this->assertFalse( $option_value );

		// Invalid parameter.
		$request->set_body( wp_json_encode( array( 'checklist_statuses' => array( 'wrong_key' => true ) ) ) );
		$result = rest_do_request( $request );

		$this->assertSame( 400, $result->get_status() );
		$this->assertSame( 'rest_invalid_param', $result->get_data()['code'] );
	}

	/**
	 * Test updating multiple options.
	 *
	 * @covers ::update_site_options
	 */
	public function test_update_multiple_options() {
		wp_set_current_user( $this->admin_id );

		$data = array(
			'launchpad_screen'   => 'off',
			'checklist_statuses' => array(
				'site_launched' => true,
			),
		);

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );

		$this->assertFalse( get_option( 'launchpad_screen' ) );

		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'off', get_option( 'launchpad_screen' ) );
		$this->assertSame( $data, $result->get_data()['updated'] );
		$this->assertSame( array( 'site_launched' => true ), get_option( 'launchpad_checklist_tasks_statuses' ) );
	}

	/**
	 * Test setting checklist as skipped.
	 */
	public function test_set_checklist_as_skipped() {
		wp_set_current_user( $this->admin_id );

		$data = array(
			'launchpad_screen' => 'skipped',
		);

		$request = new WP_REST_Request( Requests::POST, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );
		$request->set_body( wp_json_encode( $data ) );

		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( 'skipped', get_option( 'launchpad_screen' ) );
	}

	/**
	 * Provide test cases for {@see test_set_hide_fse_next_steps_modal()}.
	 *
	 * @return array[]
	 */
	public function provide_hide_fse_next_steps_modal_test_cases() {
		return array(
			// Flag value to pass, initial option, expected option.
			'Empty option and false flag'     => array( false, false, false ),
			'Empty sub-option and false flag' => array(
				false,
				array( 'test_test_test' => 1 ),
				array( 'test_test_test' => 1 ),
			),
			'True sub-option and false flag'  => array(
				false,
				array( 'hide_fse_next_steps_modal' => true ),
				false,
			),
			'True sub-option with other value and false flag' => array(
				false,
				array(
					'test_test_test'            => 2,
					'hide_fse_next_steps_modal' => true,
				),
				array(
					'test_test_test' => 2,
				),
			),
			'Empty option and true flag'      => array(
				true,
				false,
				array(
					'hide_fse_next_steps_modal' => true,
				),
			),
			'Empty sub-option and true flag'  => array(
				true,
				array( 'test_test_test' => 1 ),
				array(
					'test_test_test'            => 1,
					'hide_fse_next_steps_modal' => true,
				),
			),
			'True sub-option and true flag'   => array(
				true,
				array( 'hide_fse_next_steps_modal' => true ),
				array( 'hide_fse_next_steps_modal' => true ),
			),
			'True sub-option with other value and true flag' => array(
				true,
				array(
					'test_test_test'            => 2,
					'hide_fse_next_steps_modal' => true,
				),
				array(
					'test_test_test'            => 2,
					'hide_fse_next_steps_modal' => true,
				),
			),
		);
	}

	/**
	 * Test updates to the `hide_fse_next_steps_modal` setting.
	 *
	 * @dataProvider provide_hide_fse_next_steps_modal_test_cases()
	 * @param bool  $flag_in_api The value of hide_fse_next_steps_modal to send.
	 * @param mixed $initial_option_value The initial value for the wpcom_launchpad_config option.
	 * @param mixed $expected_option_value The expected value for the wpcom_launchpad_config option.
	 */
	public function test_set_hide_fse_next_steps_modal( $flag_in_api, $initial_option_value, $expected_option_value ) {
		wp_set_current_user( $this->admin_id );

		$data = array(
			'hide_fse_next_steps_modal' => $flag_in_api,
		);

		delete_option( 'wpcom_launchpad_config' );

		if ( false !== $initial_option_value ) {
			$this->assertTrue( update_option( 'wpcom_launchpad_config', $initial_option_value ) );
		}

		$result = $this->call_launchpad_api( Requests::POST, $data );

		$this->assertSame( 200, $result->get_status() );
		$this->assertSame( $data, $result->get_data()['updated'] );

		$this->assertSame( $flag_in_api, wpcom_launchpad_is_fse_next_steps_modal_hidden() );

		$this->assertSame( $expected_option_value, get_option( 'wpcom_launchpad_config' ) );
	}

	/**
	 * Helper function to create a new WP_REST_Request and call the Launchpad REST API.
	 *
	 * @param string     $method The HTTP method to use.
	 * @param null|array $body The body to send in the request.
	 * @return WP_REST_Response The response.
	 */
	protected function call_launchpad_api( $method, $body ) {
		$request = new WP_REST_Request( $method, '/wpcom/v2/launchpad' );
		$request->set_header( 'content_type', 'application/json' );

		if ( null !== $body ) {
			$request->set_body( wp_json_encode( $body ) );
		}

		return rest_do_request( $request );
	}
}
