<?php

use \Automattic\Jetpack\Connection\Manager as Connection_Manager;

class Jetpack_Data {
	/**
	 * @deprecated 7.5 Use Connection_Manager instead.
	 */
	public static function get_access_token( $user_id = false, $token_key = false, $suppress_errors = true ) {
		$connection = new Connection_Manager();
		return $connection->get_access_token( $user_id, $token_key, $suppress_errors );
	}
}
