<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Image_CDN implements Pluggable {

	public function setup() {
		// Image CDN needs load before Jetpack is loaded. The module is initialized along with all other modules on `plugins_loaded` action.
		Image_CDN_Setup::load();
	}

	public static function get_slug() {
		return 'image_cdn';
	}

	public static function is_available() {
		return true;
	}
}
