<?php
/**
 * The GD image editor for WordPress.com sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// This file can load before core's editor classes.
require_once ABSPATH . WPINC . '/class-wp-image-editor.php';
require_once ABSPATH . WPINC . '/class-wp-image-editor-gd.php';
require_once __DIR__ . '/class-jetpack-wpcom-ai-marker.php';

/**
 * Keeps the source's AI DigitalSourceType, which GD drops on save.
 */
class Jetpack_WPCOM_Image_Editor_GD extends WP_Image_Editor_GD {

	/**
	 * The source's AI DigitalSourceType: '' when it has none, null until the first save.
	 *
	 * @var string|null
	 */
	private $digital_source_type = null;

	/**
	 * Saves the image, then writes the source's AI DigitalSourceType into it.
	 *
	 * @param string   $filename  Path to save the image to.
	 * @param callable $callback  GD function that writes the image.
	 * @param array    $arguments Arguments for the callback.
	 * @return bool
	 */
	protected function make_image( $filename, $callback, $arguments ) {
		$marker = new Jetpack_WPCOM_AI_Marker( 'image_editor_ai_marker' );
		if ( null === $this->digital_source_type ) {
			$this->digital_source_type = $marker->read( $this->file );
		}

		$result = parent::make_image( $filename, $callback, $arguments );

		if ( $result && '' !== $this->digital_source_type && ! wp_is_stream( $filename ) ) {
			$marker->write( $filename, $this->digital_source_type );
		}

		return $result;
	}
}
