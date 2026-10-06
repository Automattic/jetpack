<?php
/**
 * Protect dashboard: the Login protection section.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\SSO\Helpers as SSO_Helpers;
use Automattic\Jetpack\IP\Utils as IP_Utils;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Brute force protection, account protection and WordPress.com login.
 *
 * @since $$next-version$$
 */
class Jetpack_Protect_Dashboard_Login_Protection implements Jetpack_Protect_Dashboard_Section {

	/**
	 * The key the section's state is printed under.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'loginProtection';
	}

	/**
	 * Each login protection method's state, the blocked attempt count and the visitor's IP.
	 *
	 * @return array
	 */
	public function get_state() {
		$brute_force = Jetpack_Protect_Dashboard::get_module_state( 'protect' );

		return array(
			'bruteForce'        => $brute_force,
			'accountProtection' => Jetpack_Protect_Dashboard::get_module_state( 'account-protection' ),
			'sso'               => Jetpack_Protect_Dashboard::get_module_state( 'sso' ),
			'blockedCount'      => $brute_force['active'] ? (int) get_site_option( 'jetpack_protect_blocked_attempts', 0 ) : null,
			// A filter or constant can force these, and Jetpack Settings then locks the toggle.
			'ssoLocks'          => array(
				'matchByEmail' => method_exists( SSO_Helpers::class, 'is_match_by_email_checkbox_disabled' ) && SSO_Helpers::is_match_by_email_checkbox_disabled(),
				'twoStep'      => method_exists( SSO_Helpers::class, 'is_require_two_step_checkbox_disabled' ) && SSO_Helpers::is_require_two_step_checkbox_disabled(),
			),
			'currentIp'         => (string) IP_Utils::get_ip(),
		);
	}

	/**
	 * The section uses the core Jetpack settings endpoints, so it has no routes of its own.
	 *
	 * @return void
	 */
	public function register_routes() {}
}

Jetpack_Protect_Dashboard::register_section( new Jetpack_Protect_Dashboard_Login_Protection() );
