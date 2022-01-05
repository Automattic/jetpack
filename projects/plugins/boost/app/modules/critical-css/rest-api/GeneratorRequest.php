<?php
/**
 * Generator request endpoint handler.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\REST_API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\CriticalCSS;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\CriticalCSSStorage;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

/**
 * Class Generator Request
 */
class GeneratorRequest implements BoostEndpoint {
	/**
	 * Request methods.
	 *
	 * @return string
	 */
	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	/**
	 * Response.
	 *
	 * @param \WP_REST_Request $request Request object.
	 */
	public function response( $request ) {
		$reset = ! empty( $request['reset'] );

		$cleared_critical_css_reason = \get_option( CriticalCSS::RESET_REASON_STORAGE_KEY );
		$generator                   = new Generator();

		if ( $reset || $cleared_critical_css_reason ) {

			$storage         = new CriticalCSSStorage();
			$recommendations = new Recommendations();

			// Create a new Critical CSS Request block to track creation request.
			$storage->clear();
			$generator->make_generation_request();
			$recommendations->reset();
			CriticalCSS::clear_reset_reason();
		}

		return rest_ensure_response(
			array(
				'status'        => 'success',
				'status_update' => $generator->get_local_critical_css_generation_info(),
			)
		);
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
		return 'critical-css/request-generate';
	}
}
