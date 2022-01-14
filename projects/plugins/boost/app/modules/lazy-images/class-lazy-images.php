<?php

namespace Automattic\Jetpack_Boost\Modules\Lazy_Images;

use Automattic\Jetpack\Jetpack_Lazy_Images;
use Automattic\Jetpack_Boost\Modules\Generic_Module;

class Lazy_Images implements Generic_Module {

	const MODULE_SLUG = 'lazy-images';

	public function initialize() {
		add_action( 'wp', array( Jetpack_Lazy_Images::class, 'instance' ) );
	}

	public function get_slug() {
		return self::MODULE_SLUG;
	}
}
