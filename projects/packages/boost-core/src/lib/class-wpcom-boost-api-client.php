<?php
/**
 * WPCOM Boost API Client interface.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Lib;

use Automattic\Jetpack\Boost_Core\Contracts\Boost_API_Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A class that handles the Boost API client.
 *
 * The communication to the backend is done using this class on top of the Boost_API_Client interface.
 */
class WPCOM_Boost_API_Client implements Boost_API_Client {

	/**
	 * Submit a POST request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $payload - Request payload.
	 * @param mixed[] $args - Request arguments.
	 * @return mixed
	 */
	public function post( $path, $payload = array(), $args = null ) {
		return Utils::send_wpcom_request(
			'POST',
			$this->get_api_path( $path ),
			$args,
			$payload
		);
	}

	/**
	 * Make a get request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $query - Query parameters.
	 * @param mixed[] $args - Request arguments.
	 * @return mixed
	 */
	public function get( $path, $query = array(), $args = null ) {
		return Utils::send_wpcom_request(
			'GET',
			add_query_arg( $query, $this->get_api_path( $path ) ),
			$args
		);
	}

	/**
	 * Get the API path for the given path.
	 *
	 * @param string $path - Request path.
	 * @return string
	 */
	private function get_api_path( $path ) {
		$blog_id = (int) \Jetpack_Options::get_option( 'id' );

		return sprintf( '/sites/%d/jetpack-boost/%s', $blog_id, $path );
	}
}
