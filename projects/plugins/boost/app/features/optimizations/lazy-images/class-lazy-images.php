<?php

namespace Automattic\Jetpack_Boost\Features\Optimizations\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Contracts\Feature;

class Lazy_Images implements Feature {

	public function setup() {
		add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
	}

	public static function get_slug() {
		return 'lazy-images';
	}

	public function setup_trigger() {
		return 'init';
	}
}
