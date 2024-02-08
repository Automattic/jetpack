<?php

namespace Automattic\Jetpack_Inspect\REST_API\Contracts;

interface Has_Endpoints {

	/**
	 * @return Endpoint[]
	 */
	public function get_endpoints();
}
