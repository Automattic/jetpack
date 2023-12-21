<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Image_Size_Analysis implements Pluggable, Is_Always_On {

	public function setup() {
		Image_Size_Analysis_Fixer::setup();
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS );
	}

	public static function get_slug() {
		return 'image_size_analysis';
	}
}
