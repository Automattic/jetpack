<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Sub_Modules;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Image_CDN implements Pluggable, Changes_Page_Output, Optimization, Has_Sub_Modules {

	const SUB_MODULES = array(
		Liar::class,
		Quality_Settings::class,
	);

	public function setup() {
		Image_CDN_Setup::load();
	}

	public function setup_sub_modules() {
		foreach ( self::SUB_MODULES as $sub_module ) {
			$sub_module_instance = new $sub_module();
			$sub_module_instance->setup();
		}
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

	public function get_sub_modules_state() {
		$state = array();
		foreach ( self::SUB_MODULES as $sub_module ) {
			$sub_module_instance                       = new $sub_module();
			$state[ $sub_module_instance->get_slug() ] = $sub_module_instance->get_state();
		}
		return $state;
	}
}
