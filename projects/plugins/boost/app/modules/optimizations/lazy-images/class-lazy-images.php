<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Contracts\Feature;

class Lazy_Images implements Feature {

	public function setup() {
		add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
	}

	public static function get_slug() {
		return 'lazy-images';
	}

	public static function is_available() {
		return true;
	}
}
