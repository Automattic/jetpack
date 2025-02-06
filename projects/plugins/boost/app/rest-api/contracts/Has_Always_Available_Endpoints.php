<?php

namespace Automattic\Jetpack_Boost\REST_API\Contracts;

/**
 * Interface for defining classes that provide endpoints which are always available.
 */
interface Has_Always_Available_Endpoints {

	/**
	 * Retrieves a list of endpoints that are always available.
	 *
	 * @return Endpoint[]
	 */
	public function get_always_available_endpoints();
}
