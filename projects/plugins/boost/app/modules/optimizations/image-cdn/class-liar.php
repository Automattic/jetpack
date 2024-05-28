<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack_Boost\Contracts\Is_Submodule;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Liar implements Pluggable, Is_Submodule {

	public function setup() {
		$image_cdn_liar = $this->get_state();
		if ( $image_cdn_liar ) {
			add_action( 'wp_footer', array( $this, 'inject_image_cdn_liar_script' ) );
		}
	}

	public function get_state() {
		return jetpack_boost_ds_get( 'image_cdn_liar' );
	}

	public static function get_slug() {
		return Premium_Features::IMAGE_CDN_LIAR;
	}

	public static function is_available() {
		return Premium_Features::has_feature( self::get_slug() );
	}

	/**
	 * Injects the image-cdn-liar.js script as an inline script in the footer.
	 */
	public function inject_image_cdn_liar_script() {
		$file = __DIR__ . '/dist/inline-liar.js';
		if ( file_exists( $file ) ) {
			// Include the JavaScript directly inline.
			// phpcs:ignore
			$data = file_get_contents( $file );
			// There's no meaningful way to escape JavaScript in this context.
			// phpcs:ignore
			echo wp_get_inline_script_tag( $data, array( 'async' => true ) );
		}
	}
}
