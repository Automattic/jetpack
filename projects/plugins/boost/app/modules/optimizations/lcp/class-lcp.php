<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Has_Activate;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Needs_To_Be_Ready;

class Lcp implements Feature, Has_Activate, Needs_To_Be_Ready, Has_Data_Sync {

	public function setup() {
		return true;
	}

	public static function activate() {
		( new LCP_Analyzer() )->start();
	}

	public static function get_slug() {
		return 'lcp';
	}

	public static function is_available() {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) && JETPACK_BOOST_ALPHA_FEATURES ) {
			return true;
		}

		return false;
	}

	/**
	 * Check if the module is ready and already serving optimized pages.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return ( new LCP_State() )->is_analyzed();
	}

	/**
	 * Get the action names that will be triggered when the module is ready.
	 *
	 * @return string[]
	 */
	public static function get_change_output_action_names() {
		return array( 'jetpack_boost_lcp_analyzed' );
	}

	/**
	 * Register data sync actions.
	 *
	 * @param Data_Sync $instance The Data_Sync object.
	 */
	public function register_data_sync( $instance ) {
		$instance->register(
			'lcp_state',
			Schema::as_assoc_array(
				array(
					'pages'        => Schema::as_array(
						Schema::as_assoc_array(
							array(
								'key'    => Schema::as_string(),
								'url'    => Schema::as_string(),
								'status' => Schema::as_string(),
							)
						)
					),
					'status'       => Schema::enum( array( 'not_analyzed', 'analyzed', 'pending', 'error' ) )->fallback( 'not_analyzed' ),
					'created'      => Schema::as_float()->nullable(),
					'updated'      => Schema::as_float()->nullable(),
					'status_error' => Schema::as_string()->nullable(),
				)
			)->fallback(
				array(
					'pages'   => array( 'fallback' ),
					'status'  => 'not_analyzed',
					'created' => null,
					'updated' => null,
				)
			)
		);
	}
}
