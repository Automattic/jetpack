<?php

/**
 * Class Jetpack_Sync_Users
 *
 * Responsible for syncing user data changes.
 */
class Jetpack_Sync_Users {
	static $user_roles = array();

	static function init() {
		if ( Jetpack::is_active() ) {
			// Kick off synchronization of user role when it changes
			add_action( 'set_user_role', array( __CLASS__, 'user_role_change' ) );
		}
	}

	/**
	 * Synchronize connected user role changes
	 */
	static function user_role_change( $user_id ) {
		if ( Jetpack::is_user_connected( $user_id ) ) {
			self::update_role_on_com( $user_id );
			// try to choose a new master if we're demoting the current one
			self::maybe_demote_master_user( $user_id );
		}
	}

	static function get_role( $user_id ) {
		if ( isset( self::$user_roles[ $user_id ] ) ) {
			return self::$user_roles[ $user_id ];
		}

		$current_user_id = get_current_user_id();
		wp_set_current_user( $user_id );
		$role = Jetpack::translate_current_user_to_role();
		wp_set_current_user( $current_user_id );
		$user_roles[ $user_id ] = $role;

		return $role;
	}

	static function get_signed_role( $user_id ) {
		return Jetpack::sign_role( self::get_role( $user_id ), $user_id );
	}

	static function update_role_on_com( $user_id ) {
		$signed_role = self::get_signed_role( $user_id );
		Jetpack::xmlrpc_async_call( 'jetpack.updateRole', $user_id, $signed_role );
	}

	static function maybe_demote_master_user( $user_id ) {
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		$role           = self::get_role( $user_id );
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
				$found_user_id = absint( $result->id );
				if ( $found_user_id && Jetpack::is_user_connected( $found_user_id ) ) {
					$new_master = $found_user_id;
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

Jetpack_Sync_Users::init();
