<?php
/**
 * WP-Admin Profile edit.
 *
 * @package Jetpack
 */

use Automattic\Jetpack\Masterbar;

/**
 * Hides profile fields for WordPress.com connected users.
 *
 * @deprecated 13.7
 *
 * @param WP_User $user The current WP_User object.
 */
function jetpack_masterbar_hide_profile_fields( $user ) {
	_deprecated_function( __FUNCTION__, 'jetpack-13.7', 'Automattic\\Jetpack\\Masterbar\\jetpack_masterbar_hide_profile_fields' );
	Masterbar\jetpack_masterbar_hide_profile_fields( $user );
}

add_action( 'personal_options', 'jetpack_masterbar_hide_profile_fields' );
