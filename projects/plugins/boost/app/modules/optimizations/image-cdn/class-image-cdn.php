<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Has_Submodules;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;

class Image_CDN implements Pluggable, Changes_Page_Output, Optimization, Has_Submodules, Has_Data_Sync {

	public function setup() {
		Image_CDN_Setup::load();
	}

	public function register_data_sync( Data_Sync $instance ) {
		$image_cdn_quality_schema = Schema::as_assoc_array(
			array(
				'jpg'  => Schema::as_assoc_array(
					array(
						'quality'  => Schema::as_number(),
						'lossless' => Schema::as_boolean(),
					)
				),
				'png'  => Schema::as_assoc_array(
					array(
						'quality'  => Schema::as_number(),
						'lossless' => Schema::as_boolean(),
					)
				),
				'webp' => Schema::as_assoc_array(
					array(
						'quality'  => Schema::as_number(),
						'lossless' => Schema::as_boolean(),
					)
				),
			)
		)->fallback(
			array(
				'jpg'  => array(
					'quality'  => 89,
					'lossless' => false,
				),
				'png'  => array(
					'quality'  => 80,
					'lossless' => false,
				),
				'webp' => array(
					'quality'  => 80,
					'lossless' => false,
				),
			)
		);

		$instance->register( 'image_cdn_quality', $image_cdn_quality_schema );
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
