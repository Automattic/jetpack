<?php
/**
 * Class used to define WAF Blocked Login Page.
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Redirect;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

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
	 * The IP block list blocks the whole site, set-password link included.
	 *
	 * @var bool
	 */
	protected $check_unfinished_registrations = false;

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
