<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Image_CDN implements Pluggable {

	public function setup() {
		Image_CDN_Setup::load();

		add_filter( 'jetpack_photon_pre_args', array( $this, 'add_quality_args' ) );
	}

	public static function get_slug() {
		return 'image_cdn';
	}

	public static function is_available() {
		return true;
	}

	/**
	 * Add quality arg to existing photon args.
	 *
	 * @param $args array - Existing photon args.
	 *
	 * @return mixed
	 */
	public function add_quality_args( $args ) {
		if ( Premium_Features::has_any() ) {
			$args['quality'] = jetpack_boost_ds_get( 'image_cdn_quality' );
		}

		return $args;
	}
}
