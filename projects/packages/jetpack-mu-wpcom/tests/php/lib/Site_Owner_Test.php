<?php
/**
 * Site Owner Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Tests for site owner lib functions.
 */
class Site_Owner_Test extends \WorDBless\BaseTestCase {

	/**
	 * Test user ID.
	 *
	 * @var int
	 */
	private $user_id;

	/**
	 * Set up before each test.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->user_id = wp_insert_user(
			array(
				'user_login' => 'site_owner_test_user',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $this->user_id );
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down(): void {
		wp_set_current_user( 0 );
		wp_delete_user( $this->user_id );
		parent::tear_down();
	}

	/**
	 * Tests that get_site_owner_id returns 0 when no owner detection is available.
	 */
	public function test_get_site_owner_id_returns_zero_without_detection() {
		$this->assertSame( 0, wpcom_get_site_owner_id() );
	}

	/**
	 * Tests that is_site_owner returns false when no owner detection is available.
	 */
	public function test_is_site_owner_returns_false_without_detection() {
		$this->assertFalse( wpcom_is_site_owner() );
	}

	/**
	 * Tests that get_site_owner_id returns master_user via Jetpack_Options.
	 */
	public function test_get_site_owner_id_via_jetpack_master_user() {
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Jetpack_Options not available' );
		}

		\Jetpack_Options::update_option( 'master_user', $this->user_id );
		$this->assertSame( $this->user_id, wpcom_get_site_owner_id() );

		\Jetpack_Options::delete_option( 'master_user' );
	}

	/**
	 * Tests that is_site_owner returns true when current user is the master_user.
	 */
	public function test_is_site_owner_via_jetpack_master_user() {
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			$this->markTestSkipped( 'Jetpack_Options not available' );
		}

		\Jetpack_Options::update_option( 'master_user', $this->user_id );
		$this->assertTrue( wpcom_is_site_owner() );

		\Jetpack_Options::update_option( 'master_user', 999999 );
		$this->assertFalse( wpcom_is_site_owner() );

		\Jetpack_Options::delete_option( 'master_user' );
	}
}
