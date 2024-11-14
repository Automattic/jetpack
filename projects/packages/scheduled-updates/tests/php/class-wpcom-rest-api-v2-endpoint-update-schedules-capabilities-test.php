<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities.
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities.
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities
 */
class WPCOM_REST_API_V2_Endpoint_Update_Schedules_Capabilities_Test extends \WorDBless\BaseTestCase {
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
	 * Make sure unauthorized users can't get in to capabilities.
	 *
	 * @covers ::get_items
	 */
	public function test_non_admin_user_capabilities() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/capabilities' );
		$result  = rest_do_request( $request );

		$this->assertSame( 401, $result->get_status() );
	}

	/**
	 * Make sure authorized users can see data for capabilities
	 *
	 * @covers ::get_items
	 */
	public function test_admin_user_capabilities() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules/capabilities' );
		wp_set_current_user( $this->admin_id );
		$result = rest_do_request( $request );

		$this->assertSame( 200, $result->get_status() );
	}
}
