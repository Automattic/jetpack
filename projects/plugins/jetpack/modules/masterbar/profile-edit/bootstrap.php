<?php
/**
 * Bootstrap the WP.com User profile edit restriction.
 *
 * @deprecated $$next-version$$
 *
 * @package automattic\jetpack
 *
 * @phan-file-suppress PhanDeprecatedFunction -- Ok for deprecated code to call other deprecated code.
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

_deprecated_file( __FILE__, 'jetpack-$$next-version$$' );

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Prevent WP.com user profile fields (first_name, last_name, display_name, description) to be updated.
 *
 * @deprecated $$next-version$$
 */
function load_the_user_profile_info_revert() {
	_deprecated_function( __FUNCTION__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Masterbar\\load_the_user_profile_info_revert' );
	new WPCOM_User_Profile_Fields_Revert( new Connection_Manager( 'jetpack' ) );
}

\add_action( 'load-profile.php', __NAMESPACE__ . '\load_the_user_profile_info_revert' );
\add_action( 'load-user-edit.php', __NAMESPACE__ . '\load_the_user_profile_info_revert' );
