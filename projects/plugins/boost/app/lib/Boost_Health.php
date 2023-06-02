<?php

namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Modules\Optimizations\Cloud_CSS\Cloud_CSS;

class Boost_Health {

	private $issues = array();

	public function __construct() {
		if ( self::critical_css_needs_regeneration() ) {
			$this->issues[] = 'Outdated Critical CSS';
		}
	}

	public function get_total_issues() {
		return count( $this->issues );
	}

	public function get_all_issues() {
		return $this->issues;
	}

	public static function critical_css_needs_regeneration() {
		if ( Cloud_CSS::is_available() ) {
			return false;
		}

		$suggest_regenerate = jetpack_boost_ds_get( 'critical_css_suggest_regenerate' );

		return in_array( $suggest_regenerate, Environment_Change_Detector::get_available_env_change_statuses(), true );
	}
}
