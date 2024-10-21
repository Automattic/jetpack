<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Foundation_Pages implements Has_Setup {

	public function setup() {
		add_filter( 'jetpack_boost_critical_css_providers', array( $this, 'remove_ccss_front_page_provider' ), 10, 2 );
	}

	public function remove_ccss_front_page_provider( $providers ) {
		$filtered_providers = array();

		foreach ( $providers as $provider ) {
			if ( $provider['key'] !== 'core_front_page' ) {
				$filtered_providers[] = $provider;
			}
		}

		return $filtered_providers;
	}

	public function get_pages() {
		return array();
	}
}
