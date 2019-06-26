<?php

use Automattic\Jetpack\Connection\Client;

/**
 * Deprecated since 7.5 in favor of packages/connection/src/Client.php
 */
_deprecated_file( basename( __FILE__ ), 'jetpack-7.5', 'packages/connection/src/Client.php' );

class Jetpack_Client {
	/**
	 * @deprecated use Automattic\Jetpack\Connection\Client::remote_request
	 */
	static function remote_request( $args, $body = null ) {
		_deprecated_function( __METHOD__, 'jetpack-7.5', 'Automattic\Jetpack\Connection\Client' );
		return Client::remote_request( $args, $body );
	}
}
