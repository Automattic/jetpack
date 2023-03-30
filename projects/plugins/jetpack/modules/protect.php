<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Module Name: Brute force protection
 * Module Description: Enabling brute force protection will prevent bots and hackers from attempting to log in to your website with common username and password combinations.
 * Sort Order: 1
 * Recommendation Order: 4
 * First Introduced: 3.4
 * Requires Connection: Yes
 * Requires User Connection: No
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: Security
 * Additional Search Queries: security, jetpack protect, secure, protection, botnet, brute force, protect, login, bot, password, passwords, strong passwords, strong password, wp-login.php,  protect admin
 */

use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection;

/**
 * Jetpack project module class.
 *
 * @deprecated $$next_version$$ - Use Automattic\Jetpack\Waf\Brute_Force_Protection\Brute_Force_Protection instead.
 */
class Jetpack_Protect_Module {
	/**
	 * Instance of the class.
	 *
	 * @var Jetpack_Protect_Module()
	 */
	private static $instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$instance, 'Jetpack_Protect_Module' ) ) {
			self::$instance = new Jetpack_Protect_Module();
		}

		return self::$instance;
	}

	/**
	 * Check if someone is able to login based on IP.
	 */
	public function has_login_ability() {
		$brute_force_protection = Brute_Force_Protection::instance();
		return $brute_force_protection->has_login_ability();
	}
}
