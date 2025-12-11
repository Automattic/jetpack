<?php

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Image_CDN;

use Automattic\Jetpack\Schema\Schema;
use Automattic\Jetpack\WP_JS_Data_Sync\Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Changes_Output_After_Activation;
use Automattic\Jetpack_Boost\Contracts\Has_Data_Sync;
use Automattic\Jetpack_Boost\Contracts\Is_Always_On;
use Automattic\Jetpack_Boost\Contracts\Sub_Feature;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Quality_Settings implements Sub_Feature, Is_Always_On, Has_Data_Sync, Changes_Output_After_Activation {

	public function setup() {
		add_filter( 'jetpack_photon_pre_args', array( $this, 'add_quality_args' ), 10, 2 );
	}

	public static function get_slug() {
		return 'image_cdn_quality';
	}

	public static function is_available() {
		return Premium_Features::has_feature( Premium_Features::IMAGE_CDN_QUALITY );
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

	public static function get_change_output_action_names() {
		return array( 'update_option_' . JETPACK_BOOST_DATASYNC_NAMESPACE . '_image_cdn_quality' );
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
		static $quality_cache = array();

		// Extract the file extension from the URL
		$file_extension = strtolower( pathinfo( $image_url, PATHINFO_EXTENSION ) );

		static $extension_to_type = array(
			'jpg'  => 'jpg',
			'jpeg' => 'jpg',
			'webp' => 'webp',
			'png'  => 'png',
		);

		if ( ! isset( $extension_to_type[ $file_extension ] ) ) {
			return null;
		}

		$type = $extension_to_type[ $file_extension ];

		if ( ! isset( $quality_cache[ $type ] ) ) {
			$quality_cache[ $type ] = $this->get_quality_for_type( $type );
		}

		return $quality_cache[ $type ];
	}

	private function get_quality_for_type( $image_type ) {
		$quality_settings = jetpack_boost_ds_get( 'image_cdn_quality' );

		if ( ! isset( $quality_settings[ $image_type ] ) ) {
			return null;
		}

		// Passing 100 to photon will result in a lossless image
		return $quality_settings[ $image_type ]['lossless'] ? 100 : $quality_settings[ $image_type ]['quality'];
	}

	public static function get_parent_features(): array {
		return array(
			Image_CDN::class,
		);
	}
}
