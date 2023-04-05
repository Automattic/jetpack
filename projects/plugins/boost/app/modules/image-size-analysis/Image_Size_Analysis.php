<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Image_Size_Analysis implements Pluggable {

	public function setup() {
		// Hello World, I shall setup myself some day.
	}

	public static function is_available() {
		return defined( 'JETPACK_BOOST_IMAGE_SIZE_ANALYSIS' ) && true === JETPACK_BOOST_IMAGE_SIZE_ANALYSIS;
	}

	public static function get_slug() {
		return 'image_size_analysis';
	}
}
