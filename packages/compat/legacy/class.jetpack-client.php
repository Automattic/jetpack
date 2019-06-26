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
		return Client::remote_request( $args, $body );
	}
}
