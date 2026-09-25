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
	 * The stand-in mapping hooked by grant_view_stats_to(), kept so tear-down can
	 * drop it by reference rather than clearing the whole `map_meta_cap` filter.
	 *
	 * @var callable|null
	 */
	private $granted_view_stats_filter = null;

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
	 * Grants a capability to a user and makes it visible to current_user_can().
	 *
	 * A capability added after login stays invisible behind the cached user object,
	 * because wp_set_current_user() returns early when the ID is unchanged. Dropping
	 * to the logged-out user first forces that object to be rebuilt.
	 *
	 * @param int    $user_id    User to grant to.
	 * @param string $capability Capability to add.
	 * @return void
	 */
	protected function grant_capability_to( $user_id, $capability ) {
		( new \WP_User( $user_id ) )->add_cap( $capability );

		wp_set_current_user( 0 );
		wp_set_current_user( $user_id );
	}

	/**
	 * Stands in for Stats' map_meta_cap, which the package under test does not boot.
	 *
	 * @param int $granted_user_id User who should hold `view_stats`.
	 * @return void
	 */
	protected function grant_view_stats_to( $granted_user_id ) {
		$this->granted_view_stats_filter = static function ( $caps, $cap, $user_id ) use ( $granted_user_id ) {
			if ( 'view_stats' === $cap && (int) $granted_user_id === (int) $user_id ) {
				return array( 'read' );
			}

			return $caps;
		};

		add_filter( 'map_meta_cap', $this->granted_view_stats_filter, 10, 3 );
	}

	/**
	 * Drops the package's mapping and this trait's stand-in for the Stats one,
	 * leaving anything else hooked on `map_meta_cap` in place.
	 *
	 * @return void
	 */
	protected function reset_analytics_capabilities() {
		Capabilities::unregister();

		if ( null !== $this->granted_view_stats_filter ) {
			remove_filter( 'map_meta_cap', $this->granted_view_stats_filter, 10 );
			$this->granted_view_stats_filter = null;
		}
	}
}
