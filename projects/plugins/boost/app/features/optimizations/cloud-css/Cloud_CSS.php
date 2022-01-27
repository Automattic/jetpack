<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Cloud_CSS;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Generate_Cloud_CSS;

class Cloud_CSS implements Feature, Has_Endpoints {

	public function initialize() {
		add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
	}

	public function get_slug() {
		return 'cloud-css';
	}

	public function get_endpoints()
	{
		return array(
			Generate_Cloud_CSS::class,
		);
	}
}
