<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Current_User_Admin;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Nonce;

class Recommendations_Reset implements Boost_Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$recommendations = new Recommendations();
		$recommendations->reset();
		wp_send_json_success();
	}

	public function permissions() {
		return [
			new Nonce( $this->name() ),
			new Current_User_Admin(),
		];
	}

	public function name() {
		return 'recommendations/reset';
	}
}
