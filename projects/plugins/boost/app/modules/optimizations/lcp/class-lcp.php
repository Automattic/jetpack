<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lcp;

use Automattic\Jetpack_Boost\Contracts\Feature;

class Lcp implements Feature {

	public function setup() {
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
}
