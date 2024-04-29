<?php
/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules, active feature.
 *
 * @package automattic/scheduled-updates
 */

use Automattic\Jetpack\Scheduled_Updates;

/**
 * Test class for WPCOM_REST_API_V2_Endpoint_Update_Schedules, active feature.
 *
 * @coversDefaultClass WPCOM_REST_API_V2_Endpoint_Update_Schedules
 */
class Scheduled_Updates_Active_Test extends \WorDBless\BaseTestCase {

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
	 * The endpoint object.
	 *
	 * @var WPCOM_REST_API_V2_Endpoint_Update_Schedules
	 */
	public static $endpoint;

	/**
	 * Set up before class.
	 *
	 * @see Restrictions here: https://github.com/php-mock/php-mock-phpunit?tab=readme-ov-file#restrictions
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$endpoint = new WPCOM_REST_API_V2_Endpoint_Update_Schedules();
	}

	/**
	 * Set up.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up_wordbless();
		\WorDBless\Users::init()->clear_all_users();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_path_user',
				'user_pass'  => 'dummy_path_pass',
				'role'       => 'administrator',
			)
		);

		wp_set_current_user( $this->admin_id );

		Scheduled_Updates::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Clean up after test
	 *
	 * @after
	 */
	public function tear_down() {
		wp_delete_user( $this->admin_id );
		delete_option( 'jetpack_scheduled_update_health_check_active' );

		parent::tear_down_wordbless();
	}

	/**
	 * Test get_items.
	 *
	 * @covers ::get_items
	 */
	public function test_get_items() {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/update-schedules' );
		$result  = rest_do_request( $request );

		// No schedules.
		$this->assertSame( 200, $result->get_status() );
	}
}
