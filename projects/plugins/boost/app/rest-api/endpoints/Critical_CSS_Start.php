<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Features\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Critical_CSS_Start implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {

		$generator = new Generator();

		$storage = new Critical_CSS_Storage();

		// Create a new Critical CSS Request block to track creation request.
		$storage->clear();
		Regenerate_Admin_Notice::dismiss();

		return rest_ensure_response(
			array(
				'status' => 'success',
				'data'   => $generator->get_local_critical_css_generation_info(),
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return 'critical-css/start';
	}
}
