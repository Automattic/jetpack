<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Data_Sync_Action;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;

class Optimize_LCP_Endpoint implements Data_Sync_Action {

	/**
	 * Handles the optimize LCP action.
	 *
	 * @param mixed            $_data    JSON Data passed to the action.
	 * @param \WP_REST_Request $_request The request object.
	 */
	public function handle( $_data, $_request ) {
		// Check if the module is enabled first.
		$states = ( new Modules_Setup() )->get_status();
		if ( ! $states['lcp'] ) {
			return array(
				'success' => false,
				'state'   => array(),
			);
		}

		$analyzer = new LCP_Analyzer();
		$state    = $analyzer->get_state();
		if ( $state->is_pending() ) {
			// If the analysis is already in progress, return the current state.
			return array(
				'success' => true,
				'state'   => $state->get(),
			);
		}

		$state = $analyzer->start();

		return array(
			'success' => true,
			'state'   => $state,
		);
	}
}
