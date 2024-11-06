<?php
/**
 * Package description here
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN;

/**
 * Class description.
 */
class Image_CDN_Setup {

	/**
	 * Initialize Image CDN.
	 */
	public static function load() {
		\Automattic\Jetpack\Assets::add_resource_hint(
			array(
				'//i0.wp.com',
			),
			'preconnect'
		);

		Image_CDN::instance();
	}
}
