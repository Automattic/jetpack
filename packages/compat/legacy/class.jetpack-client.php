<?php

use Automattic\Jetpack\Connection\Client;

class Jetpack_Client {
	static function remote_request( $args, $body = null ) {
		return Client::remote_request( $args, $body );
	}
}