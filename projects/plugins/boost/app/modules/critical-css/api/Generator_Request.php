<?php

namespace Automattic\Jetpack_Boost\Modules\Critical_CSS\API;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Generate\Generator;
use Automattic\Jetpack_Boost\Modules\Critical_CSS\Recommendations;

class Generator_Request extends Boost_API {

	public function methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function response( $request ) {
		$reset = ! empty( $request['reset'] );

		$cleared_critical_css_reason = \get_option( Critical_CSS::RESET_REASON_STORAGE_KEY );
		$generator                   = new Generator();

		if ( $reset || $cleared_critical_css_reason ) {

			$storage         = new Critical_CSS_Storage();
			$recommendations = new Recommendations();

			// Create a new Critical CSS Request block to track creation request.
			$storage->clear();
			$generator->make_generation_request();
			$recommendations->delete_all();
			Critical_CSS::clear_reset_reason();
		}

		return rest_ensure_response(
			array(
				'status'        => 'success',
				'status_update' => $generator->get_local_critical_css_generation_info(),
			)
		);
	}

	public function perrmisions() {
		return current_user_can( 'manage_options' );
	}

	protected function endpoint() {
		return 'request-generate';
	}
}