<?php
/**
 * Test helpers for the dashboard capability layer.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Creates users and stands in for the Stats package's own capability mapping.
 */
trait Analytics_Capabilities_Trait {

	/**
	 * Creates a user of the given role and makes it current.
	 *
	 * @param string $role Role slug.
	 * @return int User ID.
	 */
	protected function login_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'pa-' . $role,
				'user_pass'  => 'password',
				'user_email' => 'pa-' . $role . '@example.com',
				'role'       => $role,
			)
		);

		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * Stands in for Stats' map_meta_cap, which the package under test does not boot.
	 *
	 * @param int $granted_user_id User who should hold `view_stats`.
	 * @return void
	 */
	protected function grant_view_stats_to( $granted_user_id ) {
		add_filter(
			'map_meta_cap',
			static function ( $caps, $cap, $user_id ) use ( $granted_user_id ) {
				if ( 'view_stats' === $cap && (int) $granted_user_id === (int) $user_id ) {
					return array( 'read' );
				}

				return $caps;
			},
			10,
			3
		);
	}
}
