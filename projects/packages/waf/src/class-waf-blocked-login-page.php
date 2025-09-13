<?php
/**
 * Class used to define WAF Blocked Login Page.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Redirect;

/**
 * WAF Blocked Login Page class.
 */
class Waf_Blocked_Login_Page extends Blocked_Login_Page {

	/**
	 * Instance of the class.
	 *
	 * @var Waf_Blocked_Login_Page
	 */
	private static $instance;

	/**
	 * Instance of the class.
	 *
	 * @param string $ip_address IP address.
	 *
	 * @return Waf_Blocked_Login_Page
	 */
	public static function instance( $ip_address ) {
		if ( ! self::$instance ) {
			self::$instance = new self( $ip_address );
		}

		return self::$instance;
	}

	/**
	 * Provide the help URL for the WAF.
	 *
	 * @return string
	 */
	public function get_help_url() {
		return Redirect::get_url( 'jetpack-support-protect-troubleshooting-protect' );
	}
}
