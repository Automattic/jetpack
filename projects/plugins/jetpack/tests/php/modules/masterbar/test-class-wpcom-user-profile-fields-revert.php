<?php
/**
 * Tests for WPCOM_User_Profile_Fields_Revert class.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Dashboard_Customizations\WPCOM_User_Profile_Fields_Revert;

require_once JETPACK__PLUGIN_DIR . 'modules/masterbar/profile-edit/class-wpcom-user-profile-fields-revert.php';

/**
 * Class Test_WPCOM_User_Profile_Fields_Revert
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\WPCOM_User_Profile_Fields_Revert
 */
class Test_WPCOM_User_Profile_Fields_Revert extends \WP_UnitTestCase {

	/**
	 * Fixture user id.
	 *
	 * @var int
	 */
	private static $user_id;

	/**
	 * Create shared fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		static::$user_id = $factory->user->create(
			array(
				'role'         => 'administrator',
				'display_name' => 'old_value',
				'description'  => 'old_description',
				'first_name'   => 'old_first_name',
				'last_name'    => 'old_last_name',
			)
		);
	}

	/**
	 * Check if the revert ignores not connected users.
	 */
	public function test_if_it_skips_not_connected_users() {
		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_user_connected' )->willReturn( false );
		$service = new WPCOM_User_Profile_Fields_Revert( $connection_manager );

		$new_data = array( 'display_name' => 'new_value' );
		$data     = $service->revert_user_data_on_wp_admin_profile_update( $new_data, true, self::$user_id );

		$this->assertEquals( 'new_value', $data['display_name'] );
	}

	/**
	 * Check if the implementation prevents updating the display_name.
	 */
	public function test_revert_display_name() {
		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_user_connected' )->willReturn( true );
		$service = new WPCOM_User_Profile_Fields_Revert( $connection_manager );

		$new_data = array( 'display_name' => 'new_value' );
		$data     = $service->revert_user_data_on_wp_admin_profile_update( $new_data, true, self::$user_id );

		$this->assertEquals( 'old_value', $data['display_name'] );
	}

	/**
	 * Check if the revert works for first_name, last_name and description fields.
	 */
	public function test_revert_user_fields() {
		$connection_manager = $this->createMock( Connection_Manager::class );
		$connection_manager->method( 'is_user_connected' )->willReturn( true );
		$service = new WPCOM_User_Profile_Fields_Revert( $connection_manager );

		$new_data = array(
			'description' => 'new_description',
			'first_name'  => 'new_firstname',
			'last_name'   => 'new_lastname',
		);

		$data = $service->revert_user_meta_on_wp_admin_profile_change(
			$new_data,
			get_userdata( self::$user_id ),
			true
		);

		$this->assertEquals( 'old_description', $data['description'] );
		$this->assertEquals( 'old_first_name', $data['first_name'] );
		$this->assertEquals( 'old_last_name', $data['last_name'] );
	}
}
