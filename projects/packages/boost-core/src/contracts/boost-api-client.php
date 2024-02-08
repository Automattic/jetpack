<?php
/**
 * Boost API Client interface.
 *
 * @package automattic/jetpack-boost-core
 */

namespace Automattic\Jetpack\Boost_Core\Contracts;

/**
 * An interface to build Boost API client.
 *
 * Communication with Boost back-end should be done through this interface.
 */
interface Boost_API_Client {

	/**
	 * Submit a request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $payload - Request arguments.
	 * @return mixed
	 */
	public function post( $path, $payload = array() );

	/**
	 * Make a get request to boost API and return response.
	 *
	 * @param string  $path - Request path.
	 * @param mixed[] $query - Query parameters.
	 * @return mixed
	 */
	public function get( $path, $query = array() );
}
