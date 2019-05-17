<?php
/**
 * A logo for Jetpack.
 *
 * @package jetpack-logo
 */

namespace Jetpack\Assets;

/**
 * Create and render a Jetpack logo.
 */
class Logo implements Renderable_Interface {

	private $assets_manager;
	/**
	 * Absolute URL of the Jetpack logo.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Default image url
	 *
	 * @var string
	 */
	private $default_filename = 'logo.svg';

	public function __construct( $assets_manager = null ) {
		$this->assets_manager =
			$assets_manager instanceof Assets_Manager_Interface
				? $assets_manager
				: new Assets_Manager( array( 'images' => dirname( __FILE__ ) . '/../assets/images/' ) );
	}

	/**
	 * Build and retrieve an <img /> tag with the Jetpack logo.
	 *
	 * @return string The Jetpack logo.
	 */
	private function get_image( $filename ) {
		return sprintf(
			'<img src="%s" class="jetpack-logo" alt="%s" />',
			\esc_url( $this->assets_manager->get_image_url( $filename ) ),
			\esc_attr__(
				'Jetpack is a free plugin that utilizes powerful WordPress.com servers to enhance your site and simplify managing it',
				'jetpack'
			)
		);
	}


	/**
	 * Create a new `Logo` instance and render it.
	 *
	 * @static
	 *
	 * @param string $url Optional custom URL of a Jetpack logo.
	 * @return string The Jetpack logo.
	 */
	public function render( $filename = null ) {
		$filename = empty( $filename ) ? $this->default_filename : $filename;

		return $this->get_image( $filename );
	}
}
