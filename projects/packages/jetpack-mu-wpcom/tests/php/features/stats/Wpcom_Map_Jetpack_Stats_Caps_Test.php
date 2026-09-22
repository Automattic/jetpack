<?php
/**
 * Tests for the WordPress.com Stats capability mapping.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/stats/stats.php';

/**
 * Tests for the WordPress.com Stats capability mapping.
 */
class Wpcom_Map_Jetpack_Stats_Caps_Test extends \WorDBless\BaseTestCase {

	/**
	 * Test that an allowed secondary role grants access to Stats.
	 */
	public function test_maps_view_stats_for_multi_role_user_when_allowed_role_is_not_first() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_stats_multi_role',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$user    = new WP_User( $user_id );
		$user->add_role( 'administrator' );
		$user = new WP_User( $user_id );

		$this->assertSame( array( 'subscriber', 'administrator' ), array_values( $user->roles ) );
		$this->assertSame( array( 'read' ), wpcom_map_jetpack_stats_caps( array( 'do_not_allow' ), 'view_stats', $user_id ) );
	}

	/**
	 * Test that disallowed roles do not grant access to Stats.
	 */
	public function test_does_not_map_view_stats_for_disallowed_roles() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'wpcom_stats_disallowed_role',
				'user_pass'  => 'password',
				'role'       => 'subscriber',
			)
		);
		$caps    = array( 'do_not_allow' );

		$this->assertSame( $caps, wpcom_map_jetpack_stats_caps( $caps, 'view_stats', $user_id ) );
	}
}
