<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\REST_API\Contracts\Has_Endpoints;
use Automattic\Jetpack_Boost\REST_API\Endpoints\Image_Analysis_Start;

class Image_Size_Analysis implements Pluggable, Has_Endpoints {

	public function setup() {
		// noop
	}

	public static function is_available() {
		if ( ! defined( 'JETPACK_BOOST_IMAGE_SIZE_ANALYSIS' ) || ! JETPACK_BOOST_IMAGE_SIZE_ANALYSIS ) {
			return false;
		}

		return Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS );
	}

	public static function get_slug() {
		return 'image_size_analysis';
	}

	public function get_endpoints() {
		return array(
			new Image_Analysis_Start(),
		);
	}

}
