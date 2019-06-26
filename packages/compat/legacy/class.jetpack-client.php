<?php

use Automattic\Jetpack\Connection\Client;

/**
 * Class Jetpack_Client
 *
 * @deprecated Use Automattic\Jetpack\Connection\Client
 */
class Jetpack_Client {

	/**
	 * @deprecated use Automattic\Jetpack\Connection\Client::remote_request
	 */
	static function remote_request( $args, $body = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Connection\Client' );
		return Client::remote_request( $args, $body );
	}
}
