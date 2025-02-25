<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Speculation_Rules;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Speculation_Rules implements Pluggable, Optimization, Changes_Page_Output {
	public static function is_available() {
		if ( defined( 'JETPACK_BOOST_ALPHA_FEATURES' ) ) {
			return \JETPACK_BOOST_ALPHA_FEATURES === true;
		}

		return false;
	}

	/**
	 * Setup the module.
	 *
	 * @return void
	 */
	public function setup() {
	}

	public static function get_slug() {
		return 'speculation_rules';
	}

	public function is_ready() {
		return true;
	}
}
