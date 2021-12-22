<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;

class Status extends Boost_API {

	public function methods() {
		return \WP_REST_Server::READABLE;
	}

	public function response( $request ) {
		$generator = new Generator();
		return rest_ensure_response( $generator->get_critical_css_status() );
	}

	public function permissions() {
		return current_user_can( 'manage_options' );
	}

	protected function endpoint() {
		return 'status';
	}
}