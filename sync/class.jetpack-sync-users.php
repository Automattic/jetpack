<?php

/**
 * Class Jetpack_Sync_Users
 *
 * Responsible for syncing user data changes.
 */
class Jetpack_Sync_Users {

	static $check_sum_id = 'user_check_sum';

	static function init() {
		// Kick off synchronization of user role when it changes
		add_action( 'set_user_role', array( __CLASS__, 'user_role_change' ) );
	}

	/**
	 * Synchronize connected user role changes
	 */
	static function user_role_change( $user_id ) {
		if ( Jetpack::is_active() && Jetpack::is_user_connected( $user_id ) ) {
			$current_user_id = get_current_user_id();
			wp_set_current_user( $user_id );
			$role        = Jetpack::translate_current_user_to_role();
			$signed_role = Jetpack::sign_role( $role );
			wp_set_current_user( $current_user_id );

			$master_token   = Jetpack_Data::get_access_token( JETPACK_MASTER_USER );
			$master_user_id = absint( $master_token->external_user_id );

			if ( ! $master_user_id ) {
				return;
			} // this shouldn't happen

			Jetpack::xmlrpc_async_call( 'jetpack.updateRole', $user_id, $signed_role );
//@todo retry on failure

//try to choose a new master if we're demoting the current one
			if ( $user_id == $master_user_id && 'administrator' != $role ) {
				$query      = new WP_User_Query(
					array(
						'fields'  => array( 'id' ),
						'role'    => 'administrator',
						'orderby' => 'id',
						'exclude' => array( $master_user_id ),
					)
				);
				$new_master = false;
				foreach ( $query->results as $result ) {
					$uid = absint( $result->id );
					if ( $uid && Jetpack::is_user_connected( $uid ) ) {
						$new_master = $uid;
						break;
					}
				}

				if ( $new_master ) {
					Jetpack_Options::update_option( 'master_user', $new_master );
				}
// else disconnect..?
			}
		}
	}
}
