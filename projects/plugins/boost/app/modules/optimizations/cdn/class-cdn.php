<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\CDN;

use Automattic\Jetpack\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class CDN implements Pluggable {

	public function setup() {
		add_action( 'wp', array( Image_CDN_Setup::class, 'load' ) );
	}

	public static function get_slug() {
		return 'cdn';
	}

	public static function is_available() {
		return true;
	}
}
