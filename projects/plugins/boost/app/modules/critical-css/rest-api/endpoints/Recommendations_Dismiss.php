<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Current_User_Admin;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API\Permissions\Nonce;

class Recommendations_Dismiss implements Boost_Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$provider_key = filter_var( $request['providerKey'], FILTER_SANITIZE_STRING );
		if ( empty( $provider_key ) ) {
			wp_send_json_error();
		}

		$recommendations = new Recommendations();
		$recommendations->dismiss( $provider_key );
		wp_send_json_success();
	}

	public function permissions() {
		return [
			new Nonce( $this->name() ),
			new Current_User_Admin(),
		];
	}

	public function name() {
		return 'recommendations/dismiss';
	}

}
