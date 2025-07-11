<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_On_Activation;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Contracts\Needs_Website_To_Be_Public;
use Automattic\Jetpack_Boost\Contracts\Optimization;

class Image_CDN implements Feature, Changes_Output_On_Activation, Needs_Website_To_Be_Public, Optimization {

	public function setup() {
		Image_CDN_Setup::load();
	}

	public static function get_slug() {
		return 'image_cdn';
	}

	public static function is_available() {
		return true;
	}
}
