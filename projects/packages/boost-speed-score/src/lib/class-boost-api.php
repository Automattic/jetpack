<?php
/**
 * A helper class to help with Boost API interactions.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score\Lib;

use Automattic\Jetpack\Boost_Speed_Score\Contracts\Boost_API_Client;

/**
 * A class that handles the Boost API client.
 *
 * The communication to the backend is done using this class on top of the Boost_API_Client interface.
 */
class Boost_API {

	/**
	 * The API client instance.
	 *
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

	/**
	 * Make a get request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $args - Query parameters.
	 */
	public static function get( $path, $args = array() ) {
		return self::get_client()->get( $path, $args );
	}

	/**
	 * Submit a request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $payload - Request arguments.
	 * @return mixed
	 */
	public static function post( $path, $payload = array() ) {
		return self::get_client()->post( $path, $payload );
	}

}
