<?php

namespace Jetpack\Assets;

class Assets_Manager implements Assets_Manager_Interface {

	private $image_directory_path = '';

	public function __construct( $assets_directory = array() ) {

		if ( isset( $assets_directory['images'] ) ) {
			$image_path_relative_to_wp_content = \substr( realpath( $assets_directory['images'] ), strlen( WP_CONTENT_DIR ) );
			$this->image_directory_path        = '/' . \trim( $image_path_relative_to_wp_content, '/' ) . '/';
		}
	}

	public function get_image_url( $image ) {
		return \content_url( $this->image_directory_path . $image );
	}
}
