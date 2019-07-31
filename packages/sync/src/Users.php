<?php
/**
 * Sync for users.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\Roles;

/**
 * Class Users.
 *
 * Responsible for syncing user data changes.
 */
class Users {
	/**
	 * Roles of all users, indexed by user ID.
	 *
	 * @access public
	 * @static
	 *
	 * @var array
	 */
	public static $user_roles = array();

	/**
	 * Jetpack connection manager instance.
	 *
	 * @access public
	 * @static
	 *
	 * @var null|Automattic\Jetpack\Connection\Manager
	 */
	public static $connection = null;

	/**
	 * Initialize sync for user data changes.
	 *
	 * @access public
	 * @static
	 * @todo Eventually, connection needs to be instantiated at the top level in the sync package.
	 */
	public static function init() {
		self::$connection = new Jetpack_Connection();
		if ( self::$connection->is_active() ) {
			// Kick off synchronization of user role when it changes.
			add_action( 'set_user_role', array( __CLASS__, 'user_role_change' ) );
		}
	}

	/**
	 * Synchronize connected user role changes.
	 *
	 * @access public
	 * @static
	 *
	 * @param int $user_id ID of the user.
	 */
	public static function user_role_change( $user_id ) {
		if ( self::$connection->is_user_connected( $user_id ) ) {
			self::update_role_on_com( $user_id );
			// Try to choose a new master if we're demoting the current one.
			self::maybe_demote_master_user( $user_id );
		}
	}

	/**
	 * Retrieve the role of a user by their ID.
	 *
	 * @access public
	 * @static
	 *
	 * @param int $user_id ID of the user.
	 * @return string Role of the user.
	 */
	public static function get_role( $user_id ) {
		if ( isset( self::$user_roles[ $user_id ] ) ) {
			return self::$user_roles[ $user_id ];
		}

		$current_user_id = get_current_user_id();
		wp_set_current_user( $user_id );
		$roles = new Roles();
		$role  = $roles->translate_current_user_to_role();
		wp_set_current_user( $current_user_id );
		self::$user_roles[ $user_id ] = $role;

		return $role;
	}

	/**
	 * Retrieve the signed role of a user by their ID.
	 *
	 * @access public
	 * @static
	 *
	 * @param int $user_id ID of the user.
	 * @return string Signed role of the user.
	 */
	public static function get_signed_role( $user_id ) {
		return \Jetpack::sign_role( self::get_role( $user_id ), $user_id );
	}

	/**
	 * Retrieve the signed role and update it in WP.com for that user.
	 *
	 * @access public
	 * @static
	 *
	 * @param int $user_id ID of the user.
	 */
	public static function update_role_on_com( $user_id ) {
		$signed_role = self::get_signed_role( $user_id );
		\Jetpack::xmlrpc_async_call( 'jetpack.updateRole', $user_id, $signed_role );
	}

	/**
	 * Choose a new master user if we're demoting the current one.
	 *
	 * @access public
	 * @static
	 * @todo Disconnect if there is no user with enough capabilities to be the master user.
	 * @uses \WP_User_Query
	 *
	 * @param int $user_id ID of the user.
	 */
	public static function maybe_demote_master_user( $user_id ) {
		$master_user_id = (int) \Jetpack_Options::get_option( 'master_user' );
		$role           = self::get_role( $user_id );
		if ( $user_id === $master_user_id && 'administrator' !== $role ) {
			$query      = new \WP_User_Query(
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
				if ( $found_user_id && self::$connection->is_user_connected( $found_user_id ) ) {
					$new_master = $found_user_id;
					break;
				}
			}

			if ( $new_master ) {
				\Jetpack_Options::update_option( 'master_user', $new_master );
			}
			// TODO: else disconnect..?
		}
	}
}
