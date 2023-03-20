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

	const PACKAGE_VERSION = '1.0.0-alpha';

	/**
	 * Initialize Image CDN.
	 */
	public static function load() {
		\Automattic\Jetpack\Assets::add_resource_hint(
			array(
				'//i0.wp.com',
			),
			'dns-prefetch'
		);

		require_once __DIR__ . '/compatibility/jetpack.php';
		require_once __DIR__ . '/functions.photon.php';
		require_once __DIR__ . '/class-image-cdn.php';
		require_once __DIR__ . '/class-image-cdn-image.php';
		require_once __DIR__ . '/class-image-cdn-image-sizes.php';

		Image_CDN::instance();
	}
}
