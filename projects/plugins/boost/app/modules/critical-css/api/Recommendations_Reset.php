<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

class Recommendations_Reset extends Boost_API {

	public function methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$recommendations = new Recommendations();
		$recommendations->reset();
		wp_send_json_success();
	}

	public function permissions() {
		// @TODO: Oh noes. Where did the nonce go?
		// wp_verify_nonce( $request['nonce'], self::RECOMMENDATION_NONCE )
		return current_user_can( 'manage_options' );
	}

	protected function endpoint() {
		return 'recommendations/reset';
	}
}