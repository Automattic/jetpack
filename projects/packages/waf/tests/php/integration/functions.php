<?php
/**
 * Functions that mock functionality for testing purposes.
 *
 * @package automattic/jetpack-waf
 */

if ( ! function_exists( 'mysql_get_server_info' ) ) {
	/**
	 * Mock mysql_get_server_info for PHP >= 7.0.0.
	 * This gets called by the `dbDelta()` function when creating the blocklog table in WorDBless.
	 *
	 * @link https://www.php.net/manual/en/function.mysql-get-server-info.php
	 * @return false
	 */
	function mysql_get_server_info() {
		return false;
	}
}
