<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Lazy_Images implements Pluggable {

	public function setup() {
		add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
	}

	public static function get_slug() {
		return 'lazy_images';
	}

	public static function is_available() {
		return true;
	}
}
