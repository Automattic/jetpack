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
	 * Provide the help URL for Brute Force Protection.
	 *
	 * @return string
	 */
	public function get_help_url() {
		return Redirect::get_url( 'jetpack-support-jetpack-waf', array( 'anchor' => 'troubleshooting' ) );
	}
}
