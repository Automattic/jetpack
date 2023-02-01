<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Minify;

use Automattic\Jetpack_Boost\Contracts\Feature;

class Minify implements Feature {

	public function setup() {
		require_once JETPACK_BOOST_DIR_PATH . '/legacy/page-optimize/page-optimize.php';
	}

	public static function get_slug() {
		return 'minify';
	}

	public function setup_trigger() {
		return 'plugins_loaded';
	}
}
