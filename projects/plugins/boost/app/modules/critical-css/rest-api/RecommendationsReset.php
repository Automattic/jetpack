<?php
/**
 * Recommendation reset endpoint handler.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

/**
 * Class Recommendations reset.
 */
class RecommendationsReset implements BoostEndpoint, NonceProtection {
	/**
	 * Request methods.
	 *
	 * @return string
	 */
	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	/**
	 * Handler for recommendation reset.
	 *
	 * @param \WP_REST_Request $request The request object.
	 */
	public function response( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$recommendations = new Recommendations();
		$recommendations->reset();
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
		return 'recommendations/reset';
	}
}
