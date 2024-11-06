<?php

namespace Automattic\Jetpack_Boost\Lib\Critical_CSS;

use Automattic\Jetpack_Boost\Admin\Regenerate_Admin_Notice;
use Automattic\Jetpack_Boost\Lib\Critical_CSS\Source_Providers\Source_Providers;
use Automattic\Jetpack_Boost\Modules\Modules_Setup;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;
use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS_Followup;

class Regenerate {
	/** @var Critical_CSS_State */
	private $state;

	public function is_cloud_css() {
		$optimizations = ( new Modules_Setup() )->get_status();
		return isset( $optimizations[ Cloud_CSS::get_slug() ] ) && $optimizations[ Cloud_CSS::get_slug() ];
	}

	public function start() {
		// Get Critical CSS Source URLs
		$source_providers = new Source_Providers();
		$providers        = $source_providers->get_provider_sources();

		// Store those URLs in the Critical CSS State
		$this->state = new Critical_CSS_State();
		$this->state->prepare_request()
				->set_pending_providers( $providers )
				->save();

		// Get the data
		$data = $this->state->get();

		if ( $this->is_cloud_css() ) {
			// If this is a cloud CSS request, we need to trigger the generation
			// of the CSS and return the URL to the CSS file.
			$cloud_css = new Cloud_CSS();
			$cloud_css->regenerate_cloud_css( Cloud_CSS::REGENERATE_REASON_USER_REQUEST, $cloud_css->get_all_providers() );
			Cloud_CSS_Followup::schedule();
		}

		// Clear previous Critical CSS From storage
		$storage = new Critical_CSS_Storage();
		$storage->clear();

		// Dismiss admin notices
		Regenerate_Admin_Notice::dismiss();
		jetpack_boost_ds_delete( 'critical_css_suggest_regenerate' );

		return $data;
	}

	public function get_state() {
		return $this->state;
	}
}
