<?php

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

class Jetpack_Data {
	/**
	 * @deprecated 7.5 Use Connection_Manager instead
	 *
	 * @param int|false    $user_id   false: Return the Blog Token. int: Return that user's User Token.
	 * @param string|false $token_key If provided, check that the token matches the provided input.
	 *                                false                                : Use first token. Default.
	 *                                Jetpack_Data::MAGIC_NORMAL_TOKEN_KEY : Use first Normal Token.
	 *                                non-empty string                     : Use matching token
	 * @return object|false
	 */
	public static function get_access_token( $user_id = false, $token_key = false ) {
		$connection_manager = new Connection_Manager();
		return $connection_manager->get_access_token( $user_id, $token_key );
	}
}
