<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Image_CDN implements Pluggable, Changes_Page_Output, Optimization, Has_Submodules {

	public function setup() {
		Image_CDN_Setup::load();
	}

	public static function get_slug() {
		return 'image_cdn';
	}

	/**
	 * The module starts serving as soon as it's enabled.
	 *
	 * @return bool
	 */
	public function is_ready() {
		return true;
	}

	public static function is_available() {
		return true;
	}

	public function get_submodules() {
		return array(
			Liar::class,
			Quality_Settings::class,
		);
	}
}
