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
	 * Provide the help URL for the WAF.
	 *
	 * @return string
	 */
	public function get_help_url() {
		return Redirect::get_url( 'jetpack-support-protect-troubleshooting-protect' );
	}
}
