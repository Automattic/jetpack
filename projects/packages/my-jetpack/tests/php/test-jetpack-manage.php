<?php
/**
 * Test the Jetpack Manage features in My Jetpack.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WorDBless\BaseTestCase;

class Test_Jetpack_Manage extends BaseTestCase {
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
}
