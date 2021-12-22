<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;

class Generator_Status implements Boost_Endpoint {

	public function request_methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $request ) {
		$generator = new Generator();
		return rest_ensure_response( $generator->get_critical_css_status() );
	}

	public function permission_callback( $request ) {
		return current_user_can( 'manage_options' );
	}

	public function name() {
		return 'status';
	}
}