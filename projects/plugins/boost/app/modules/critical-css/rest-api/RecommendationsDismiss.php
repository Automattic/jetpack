<?php
/**
 * Recommendations dismiss endpoint handler.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

/**
 * Class Recommendations dismiss.
 */
class RecommendationsDismiss implements BoostEndpoint, NonceProtection {
	/**
	 * Request methods.
	 *
	 * @return string
	 */
	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	/**
	 * Handler for recommendation dismissal.
	 *
	 * @param \WP_REST_Request $request The request object.
	 */
	public function response( $request ) {
		$provider_key = filter_var( $request['providerKey'], FILTER_SANITIZE_STRING );
		if ( empty( $provider_key ) ) {
			wp_send_json_error();
		}

		$recommendations = new Recommendations();
		$recommendations->dismiss( $provider_key );
		wp_send_json_success();
	}

	/**
	 * Permission callback.
	 */
	public function permission_callback() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Route endpoint name.
	 *
	 * @return string
	 */
	public function name() {
		return 'recommendations/dismiss';
	}

}
