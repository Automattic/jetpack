<?php
/**
 * A user roles class for Jetpack.
 *
 * @package jetpack-roles
 */

namespace Automattic\Jetpack;

/**
 * Class Automattic\Jetpack\Roles
 *
 * Contains utilities for translating user roles to capabilities and vice versa.
 */
class Roles {
	/**
	 * Map of roles we care about, and their corresponding minimum capabilities.
	 *
	 * @access protected
	 * @static
	 *
	 * @var array
	 */
	protected static $capability_translations = array(
		'administrator' => 'manage_options',
		'editor'        => 'edit_others_posts',
		'author'        => 'publish_posts',
		'contributor'   => 'edit_posts',
		'subscriber'    => 'read',
	);

	/**
	 * Get the role of the current user.
	 *
	 * @return string|boolean Current user's role, false if not enough capabilities for any of the roles.
	 */
	public static function translate_current_user_to_role() {
		foreach ( self::$capability_translations as $role => $cap ) {
			if ( current_user_can( $role ) || current_user_can( $cap ) ) {
				return $role;
			}
		}

		return false;
	}

	/**
	 * Get the role of a particular user.
	 *
	 * @param \WP_User $user User object.
	 * @return string|boolean User's role, false if not enough capabilities for any of the roles.
	 */
	public static function translate_user_to_role( $user ) {
		foreach ( self::$capability_translations as $role => $cap ) {
			if ( user_can( $user, $role ) || user_can( $user, $cap ) ) {
				return $role;
			}
		}

		return false;
	}

	/**
	 * Get the minimum capability for a role.
	 *
	 * @param string $role Role name.
	 * @return string|boolean Capability, false if role isn't mapped to any capabilities.
	 */
	public static function translate_role_to_cap( $role ) {
		if ( ! isset( self::$capability_translations[ $role ] ) ) {
			return false;
		}

		return self::$capability_translations[ $role ];
	}
}
