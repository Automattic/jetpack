<?php

use Automattic\Jetpack\Connection\Tokens;

class Jetpack_Data {
	/**
	 * @deprecated 7.5 Use Connection_Manager instead.
	 */
	public static function get_access_token( $user_id = false, $token_key = false, $suppress_errors = true ) {
		return ( new Tokens() )->get_access_token( $user_id, $token_key, $suppress_errors );
	}
}
