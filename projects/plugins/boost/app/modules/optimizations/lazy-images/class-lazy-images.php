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
		// In some scenarios, Lazy Images can conflict with other WordPress features.
		// If we detect that, the feature should not be available.
		if ( Jetpack_Lazy_Images::should_force_deactivate() ) {
			return false;
		}

		return true;
	}
}
