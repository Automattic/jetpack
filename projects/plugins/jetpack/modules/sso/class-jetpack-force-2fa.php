<?php
/**
 * Force Jetpack 2FA Functionality
 *
 * Ported from original repo at https://github.com/automattic/jetpack-force-2fa
 *
 * @deprecated $$next-version$$ Use Automattic\Jetpack\Connection\Manager\SSO instead.
 *
 * phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
 *
 * @package automattic/jetpack
 */

/**
 * Force users to use two factor authentication.
 *
 * @deprecated $$next-version$$
 */
class Jetpack_Force_2FA {

	/**
	 * The role to force 2FA for.
	 *
	 * Defaults to manage_options via the plugins_loaded function.
	 * Can be modified with the jetpack_force_2fa_cap filter.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @var string
	 */
	private $role;

	/**
	 * Constructor.
	 *
	 * @deprecated $$next-version$$
	 */
	public function __construct() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::__construct' );
	}

	/**
	 * Load the plugin via the plugins_loaded hook.
	 *
	 * @deprecated $$next-version$$
	 */
	public function plugins_loaded() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::plugins_loaded' );
	}

	/**
	 * Display an admin notice if Jetpack SSO is not active.
	 *
	 * @deprecated $$next-version$$
	 */
	public function admin_notice() {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::admin_notice' );
	}

	/**
	 * Specifically set the two step filter for Jetpack SSO.
	 *
	 * @deprecated $$next-version$$
	 *
	 * @param Object $user_data The user data from WordPress.com.
	 */
	public function jetpack_set_two_step( $user_data ) {
		_deprecated_function( __METHOD__, 'jetpack-$$next-version$$', 'Automattic\\Jetpack\\Connection\\Manager\\SSO\\Force_2FA::jetpack_set_two_step' );
	}
}
