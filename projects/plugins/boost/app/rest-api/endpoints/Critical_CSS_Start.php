<?php

namespace Automattic\Jetpack_Boost\REST_API\Endpoints;

use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_State;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Critical_CSS_Storage;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS_Followup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Critical_CSS\Generator;
use Automattic\Jetpack_Boost\REST_API\Contracts\Endpoint;
use Automattic\Jetpack_Boost\REST_API\Permissions\Current_User_Admin;

class Critical_CSS_Start implements Endpoint {

	public function request_methods() {
		return \WP_REST_Server::EDITABLE;
	}

	public function is_cloud_css() {
		$optimizations = ( new Modules_Setup() )->get_status();
		return isset( $optimizations[ Cloud_CSS::get_slug() ] ) && $optimizations[ Cloud_CSS::get_slug() ];
	}

	public function response( $_request ) {

		// Get Critical CSS Source URLs
		$source_providers = new Source_Providers();
		$providers        = $source_providers->get_provider_sources();

		// Store those URLs in the Critical CSS State
		$state = new Critical_CSS_State();
		$state->prepare_request()
				->set_pending_providers( $providers )
				->save();

		// Get the data
		$data = $state->get();

		if ( $this->is_cloud_css() ) {
			// If this is a cloud CSS request, we need to trigger the generation
			// of the CSS and return the URL to the CSS file.
			$cloud_css = new Cloud_CSS();
			$cloud_css->regenerate_cloud_css();
			Cloud_CSS_Followup::schedule();
		} else {
			$generator = new Generator();
			$data      = array_merge( $data, $generator->get_generation_metadata() );
		}

		// Clear previous Critical CSS From storage
		$storage = new Critical_CSS_Storage();
		$storage->clear();

		// Dismiss admin notices
		Regenerate_Admin_Notice::dismiss();

		return rest_ensure_response(
			array(
				'status' => $state->has_errors() ? 'error' : 'success',
				'data'   => $data,
			)
		);
	}

	public function permissions() {
		return array(
			new Current_User_Admin(),
		);
	}

	public function name() {
		return 'critical-css/start';
	}
}
