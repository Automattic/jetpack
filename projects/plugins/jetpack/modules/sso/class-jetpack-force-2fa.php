<?php
/**
 * Force Jetpack 2FA Functionality
 *
 * Ported from original repo at https://github.com/automattic/jetpack-force-2fa
 *
 * @deprecated 13.5 Use Automattic\Jetpack\Connection\Manager\SSO instead.
 *
 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
 *
 * @package automattic/jetpack
 */

/**
 * Force users to use two factor authentication.
 *
 * @deprecated 13.5
 */
class Jetpack_Force_2FA {

	/**
	 * The role to force 2FA for.
	 *
	 * Defaults to manage_options via the plugins_loaded function.
	 * Can be modified with the jetpack_force_2fa_cap filter.
	 *
	 * @deprecated 13.5
	 *
	 * @var string
	 */
	private $role;

	/**
	 * Constructor.
	 *
	 * @deprecated 13.5
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::__construct' );
	}

	/**
	 * Load the plugin via the plugins_loaded hook.
	 *
	 * @deprecated 13.5
	 */
	public function plugins_loaded() {
		_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::plugins_loaded' );
	}

	/**
	 * Display an admin notice if Jetpack SSO is not active.
	 *
	 * @deprecated 13.5
	 */
	public function admin_notice() {
		_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::admin_notice' );
	}

	/**
	 * Specifically set the two step filter for Jetpack SSO.
	 *
	 * @deprecated 13.5
	 *
	 * @param Object $user_data The user data from WordPress.com.
	 */
	public function jetpack_set_two_step( $user_data ) {
		_deprecated_function( __METHOD__, 'jetpack-13.5', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::jetpack_set_two_step' );
	}
}
