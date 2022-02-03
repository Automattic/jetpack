<?php
namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generate_Cloud_CSS;
use Automattic\Jetpack_Boost\REST_API\REST_API;

class Cloud_CSS implements Feature, Has_Endpoints {

	public function setup() {
		REST_API::register( $this->get_endpoints() );
		return true;
	}

	public function get_slug() {
		return 'cloud-css';
	}

	public function get_endpoints()
	{
		return array(
			new Generate_Cloud_CSS(),
		);
	}

	/**
	 * @inheritDoc
	 */
	public function setup_trigger() {
		return 'init';
	}
}
