<?php
/**
 * A helper class to help with Boost API interactions.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Lib;

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;

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
	 * Get the API client instance.
	 *
	 * @return Boost_API_Client
	 * @deprecated 3.1.1 Use get(), and post() directly instead.
	 */
	public static function get_client() {
		return self::get_api_client();
	}

	/**
	 * Instantiate the API client.
	 *
	 * @return Boost_API_Client
	 */
	private static function get_api_client() {
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
	 * @param mixed[] $query - Query parameters.
	 * @param mixed[] $args - Request arguments.
	 * @return array|\WP_Error
	 */
	public static function get( $path, $query = array(), $args = null ) {
		// @phan-suppress-next-line PhanParamTooMany -- By default this is WPCOM_Boost_API_Client, which accepts an extra param.
		return self::get_api_client()->get( $path, $query, self::merge_args( $args ) );
	}

	/**
	 * Submit a request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $payload - Request arguments.
	 * @param mixed[] $args - Request arguments.
	 * @return mixed
	 */
	public static function post( $path, $payload = array(), $args = null ) {
		// @phan-suppress-next-line PhanParamTooMany -- By default this is WPCOM_Boost_API_Client, which accepts an extra param.
		return self::get_api_client()->post( $path, $payload, self::merge_args( $args ) );
	}

	/**
	 * Merge the arguments with the defaults.
	 *
	 * @param mixed[] $args - Provided arguments.
	 * @return mixed[]
	 */
	private static function merge_args( $args ) {
		if ( ! is_array( $args ) ) {
			$args = wp_parse_args(
				$args,
				array(
					'headers' => self::default_headers(),
				)
			);
		} else {
			$args['headers'] = wp_parse_args( $args['headers'] ?? array(), self::default_headers() );
		}

		return $args;
	}

	/**
	 * Get the default headers to include with each request.
	 *
	 * @return string[]
	 */
	public static function default_headers() {
		$headers = array(
			'Content-Type' => 'application/json; charset=utf-8',
		);

		if ( defined( 'JETPACK_BOOST_VERSION' ) ) {
			$headers['X-Jetpack-Boost-Version'] = JETPACK_BOOST_VERSION;
		}

		return $headers;
	}
}
