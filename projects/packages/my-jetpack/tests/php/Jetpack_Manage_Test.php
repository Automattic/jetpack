<?php
/**
 * Test the Jetpack Manage features in My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

class Jetpack_Manage_Test extends BaseTestCase {
	/**
	 * Admin user id
	 *
	 * @var int
	 */
	protected $admin_id;

	/**
	 * Editor user id
	 *
	 * @var int
	 */
	protected $editor_id;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user',
				'user_pass'  => 'dummy_pass',
				'role'       => 'administrator',
			)
		);

		$this->editor_id = wp_insert_user(
			array(
				'user_login' => 'dummy_user_2',
				'user_pass'  => 'dummy_pass_2',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( 0 );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
	}

	/**
	 * Test that the menu is not added when on multisite.
	 */
	public function test_add_submenu_jetpack_multisite() {
		if ( is_multisite() ) {
			$this->assertFalse( Jetpack_Manage::add_submenu_jetpack() );
		}

		$this->assertNotFalse( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the menu doesn't appear for non-admins.
	 */
	public function test_add_submenu_jetpack_editor() {
		wp_set_current_user( $this->editor_id );

		$this->assertNull( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the menu appears for admins.
	 */
	public function test_add_submenu_jetpack_admin() {
		wp_set_current_user( $this->admin_id );

		$this->assertNotFalse( Jetpack_Manage::add_submenu_jetpack() );
	}

	/**
	 * Test that the banner is not dismissed by default.
	 */
	public function test_is_banner_dismissed_defaults_to_false() {
		$this->assertFalse( Jetpack_Manage::is_banner_dismissed() );
	}

	/**
	 * Test that dismissing the banner persists the dismissal.
	 */
	public function test_dismiss_banner_persists_dismissal() {
		wp_set_current_user( $this->admin_id );

		$response = Jetpack_Manage::dismiss_banner();

		$this->assertSame( array( 'success' => true ), $response->get_data() );
		$this->assertTrue( Jetpack_Manage::is_banner_dismissed() );
	}

	/**
	 * Test that the dismissed state is exposed to the front end.
	 */
	public function test_get_jetpack_manage_data_exposes_dismissed_state() {
		$data = Jetpack_Manage::get_jetpack_manage_data()->get_data();

		$this->assertArrayHasKey( 'isDismissed', $data );
		$this->assertFalse( $data['isDismissed'] );

		Jetpack_Manage::dismiss_banner();

		$this->assertTrue( Jetpack_Manage::get_jetpack_manage_data()->get_data()['isDismissed'] );
	}

	/**
	 * Test that only users who can manage options may dismiss the banner.
	 */
	public function test_permissions_callback_requires_manage_options() {
		wp_set_current_user( $this->editor_id );
		$this->assertFalse( Jetpack_Manage::permissions_callback() );

		wp_set_current_user( $this->admin_id );
		$this->assertTrue( Jetpack_Manage::permissions_callback() );
	}
}
