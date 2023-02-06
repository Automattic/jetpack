<?php
/**
 * A helper class to help with Boost API interactions.
 */
namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Boost_API_Client;

class Boost_API {
	/**
	 * @var Boost_API_Client
	 */
	private static $api_client;

	/**
	 * Instantiate the API client.
	 *
	 * @return Boost_API_Client
	 */
	public static function get_client() {
		if ( ! self::$api_client ) {
			$class            = apply_filters( 'jetpack_boost_api_client_class', WPCOM_Boost_API_Client::class );
			self::$api_client = new $class();
		}
		return self::$api_client;
	}

	public static function get( $path, $args = array() ) {
		return self::get_client()->get( $path, $args );
	}

	public static function post( $path, $payload = array() ) {
		return self::get_client()->post( $path, $payload );
	}

}
