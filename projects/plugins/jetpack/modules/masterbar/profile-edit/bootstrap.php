<?php
/**
 * Bootstrap the WP.com User profile edit restriction.
 *
 * @package automattic\jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Masterbar;

/**
 * Prevent WP.com user profile fields (first_name, last_name, display_name, description) to be updated.
 *
 * @deprecated $$next-version$$
 */
function load_the_user_profile_info_revert() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\load_the_user_profile_info_revert' );
	Masterbar\load_the_user_profile_info_revert();
}

\add_action( 'load-profile.php', __NAMESPACE__ . '\load_the_user_profile_info_revert' );
\add_action( 'load-user-edit.php', __NAMESPACE__ . '\load_the_user_profile_info_revert' );
