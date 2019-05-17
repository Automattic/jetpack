<?php

namespace Jetpack\Assets;

/**
 * Interface Assets_Manager_Interface
 */
interface Assets_Manager_Interface {
	/**
	 * Assets_Manager_Interface constructor.
	 *
	 * @param array $assets_directory
	 */
	public function __construct( $assets_directory );

	/**
	 * returns the full url to the filename
	 *
	 * @param string $filename
	 *
	 * @return string
	 */
	public function get_image_url( $filename );
}
