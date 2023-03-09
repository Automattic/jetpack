<?php

namespace Automattic\Jetpack_Boost\Features\Image_Size_Report;

use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Contracts\Feature;
use Automattic\Jetpack_Boost\Lib\Analytics;

class Image_Size_Report implements Feature {

	public function setup() {
		// Hello World, I shall setup myself some day.
	}

	public static function is_available() {
		return defined( 'JETPACK_BOOST_IMAGE_SIZE_REPORT' ) && true === JETPACK_BOOST_IMAGE_SIZE_REPORT;
	}


	public static function get_slug() {
		return 'image-size-report';
	}
}
