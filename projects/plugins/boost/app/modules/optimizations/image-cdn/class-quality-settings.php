<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack_Boost\Contracts\Changes_Page_Output;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Pluggable;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Quality_Settings implements Pluggable, Changes_Page_Output, Is_Always_On {

	public function setup() {
		add_filter( 'jetpack_photon_pre_args', array( $this, 'add_quality_args' ), 10, 2 );
	}

	public static function get_slug() {
		return Premium_Features::IMAGE_CDN_QUALITY;
	}

	public static function is_available() {
		return Premium_Features::has_feature( self::get_slug() );
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
}
