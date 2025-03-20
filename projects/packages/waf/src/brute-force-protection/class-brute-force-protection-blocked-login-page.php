<?php
/**
 * Class used to define Brute Force Protection Blocked Login Page.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf\Brute_Force_Protection;

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Waf\Blocked_Login_Page;

/**
 * Brute Force Protection Blocked Login Page class.
 */
class Brute_Force_Protection_Blocked_Login_Page extends Blocked_Login_Page {

	/**
	 * Instance of the class.
	 *
	 * @var Brute_Force_Protection_Blocked_Login_Page
	 */
	private static $instance;

	/**
	 * Instance of the class.
	 *
	 * @param string $ip_address IP address.
	 *
	 * @return Brute_Force_Protection_Blocked_Login_Page
	 */
	public static function instance( $ip_address ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $ip_address );
		}

		return self::$instance;
	}

	/**
	 * Provide the help URL for Brute Force Protection.
	 *
	 * @return string
	 */
	public function get_help_url() {
		return Redirect::get_url( 'jetpack-support-jetpack-waf', array( 'anchor' => 'troubleshooting' ) );
	}
}
