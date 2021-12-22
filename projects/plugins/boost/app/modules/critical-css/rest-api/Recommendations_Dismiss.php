<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

class Recommendations_Dismiss extends Boost_API {

	// @TODO: Implement nonces
	const RECOMMENDATION_NONCE = 'dismiss_notice';

	public function methods() {
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
		// @TODO: Oh noes. Where did the nonce go?
		// wp_verify_nonce( $request['nonce'], self::RECOMMENDATION_NONCE )
		return current_user_can( 'manage_options' );
	}

	protected function endpoint() {
		return 'recommendations/dismiss';
	}

	/**
	 * @TODO:
	 * Add Critical CSS related constants to be passed to JavaScript whether the module is enabled.
	 *
	 * @param array $constants Constants to be passed to JavaScript.
	 *
	 * @return array
	 */
	public function add_boost_js_constants( $constants ) {

		// @TODO: This currently is a regression in both Dismiss and Reset REST API Classes
		// Nonces aren't created if the module is deactivated,
		// So you can't dismiss the recommendation if you don't reload the page.
		$constants['criticalCssDismissRecommendationsNonce'] = wp_create_nonce( self::RECOMMENDATION_NONCE );

		return $constants;
	}
}