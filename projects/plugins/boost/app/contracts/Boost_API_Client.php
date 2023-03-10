<?php

namespace Automattic\Jetpack_Boost\Contracts;

/**
 * An interface to build Boost API client.
 *
 * Communication with Boost back-end should be done through this interface.
 */
interface Boost_API_Client {

	/**
	 * Submit a request to boost API and return response.
	 *
	 * @param $method string Request method POST|GET|PUT|PATCH|DELETE
	 * @param $path string Request path
	 * @param $args mixed[] Request arguments
	 * @return mixed
	 */
	public function post( $path, $payload = array() );

	/**
	 * Make a get request to boost API and return response.
	 *
	 * @param $path string Request path
	 * @param $query mixed[] Query parameters
	 */
	public function get( $path, $query = array() );
}
