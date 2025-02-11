<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync\Data_Sync_Setup;

class Image_Size_Analysis implements Pluggable, Is_Always_On, Has_Data_Sync {

	public function setup() {
		Image_Size_Analysis_Fixer::setup();
	}

	public static function register_data_sync( Data_Sync $instance ) {
		Data_Sync_Setup::register_data_sync( $instance );
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::IMAGE_SIZE_ANALYSIS );
	}

	public static function get_slug() {
		return 'image_size_analysis';
	}
}
