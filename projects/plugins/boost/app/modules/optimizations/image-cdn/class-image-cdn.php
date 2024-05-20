<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Image_CDN\Image_CDN_Setup;
use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Optimization;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Image_CDN implements Pluggable, Changes_Page_Output, Optimization {

	public function setup() {
		Image_CDN_Setup::load();

		if ( Premium_Features::has_feature( Premium_Features::IMAGE_CDN_QUALITY ) ) {
			add_filter( 'jetpack_photon_pre_args', array( $this, 'add_quality_args' ), 10, 2 );
		}

		if ( Premium_Features::has_feature( Premium_Features::IMAGE_CDN_LIAR ) ) {
			$image_cdn_liar = jetpack_boost_ds_get( 'image_cdn_liar' );
			if ( $image_cdn_liar ) {
				add_action( 'wp_footer', array( $this, 'inject_image_cdn_liar_script' ) );
			}
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

	/**
	 * Add quality arg to existing photon args.
	 *
	 * @param array $args - Existing photon args.
	 *
	 * @return mixed
	 */
	public function add_quality_args( $args, $image_url ) {
		$quality = $this->get_quality_for_image( $image_url );

		if ( $quality !== null ) {
			$args['quality'] = $quality;
		}

		return $args;
	}

	/**
	 * Get the quality for an image based on the extension.
	 */
	private function get_quality_for_image( $image_url ) {
		// Define an associative array to map extensions to image types
		$extension_to_quality = array(
			'jpg'  => $this->get_quality_for_type( 'jpg' ),
			'jpeg' => $this->get_quality_for_type( 'jpg' ),
			'webp' => $this->get_quality_for_type( 'webp' ),
			'png'  => $this->get_quality_for_type( 'png' ),
		);

		// Extract the file extension from the URL
		$file_extension = pathinfo( $image_url, PATHINFO_EXTENSION );

		// Convert the extension to lowercase for case-insensitive comparison
		$file_extension = strtolower( $file_extension );

		// Determine the image type based on the extension
		if ( isset( $extension_to_quality[ $file_extension ] ) ) {
			return $extension_to_quality[ $file_extension ];
		}

		return null;
	}

	private function get_quality_for_type( $image_type ) {
		$quality_settings = jetpack_boost_ds_get( 'image_cdn_quality' );

		if ( ! isset( $quality_settings[ $image_type ] ) ) {
			return null;
		}

		// Passing 100 to photon will result in a lossless image
		return $quality_settings[ $image_type ]['lossless'] ? 100 : $quality_settings[ $image_type ]['quality'];
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
