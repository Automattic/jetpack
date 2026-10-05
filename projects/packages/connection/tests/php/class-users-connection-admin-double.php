<?php
/**
 * Test double for Users_Connection_Admin.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

/**
 * Reports a connected-user count without reaching a database.
 *
 * The real count runs a WP_User_Query so that users removed from this site are counted
 * out, and WorDBless does not run that query — it returns no results whatever is seeded.
 * Without this the view would always look empty and none of the rendering assertions
 * would be testing what they claim to.
 */
class Users_Connection_Admin_Double extends Users_Connection_Admin {

	/**
	 * Count the double reports.
	 *
	 * @var int
	 */
	public static $connected_count = 0;

	/**
	 * Report the seeded count instead of querying.
	 *
	 * @return int
	 */
	protected static function count_connected_users() {
		return static::$connected_count;
	}
}
