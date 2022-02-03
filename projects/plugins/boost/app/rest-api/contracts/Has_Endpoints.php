<?php

namespace Automattic\Jetpack_Boost\REST_API\Contracts;

interface Has_Endpoints {

	/**
	 * @return Endpoint[]
	 */
	public function get_endpoints();
}
