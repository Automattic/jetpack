<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Class for photon functionality.
 *
 * @package automattic/jetpack
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN instead.
 */

use Automattic\Jetpack\Image_CDN\Image_CDN;

/**
 * Class Jetpack_Photon
 *
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN instead.
 */
class Jetpack_Photon {

	/**
	 * Forward all method calls to the Image_CDN class.
	 *
	 * @param string $name The name of the method.
	 * @param array  $arguments The arguments to pass to the method.
	 *
	 * @throws Exception If the method is not found.
	 */
	public function __call( $name, $arguments ) {
		if ( method_exists( Image_CDN::class, $name ) ) {
			_deprecated_function( __CLASS__ . '::' . esc_html( $name ), 'jetpack-12.2', 'Automattic\Jetpack\Image_CDN\Image_CDN::' . esc_html( $name ) );
			return Image_CDN::instance()->$name( ...$arguments );
		} else {
			// Handle cases where the method is not found
			throw new Exception( sprintf( 'Undefined method: %s', esc_html( $name ) ) );
		}
	}

	/**
	 * Forward all static method calls to the Image_CDN class.
	 *
	 * @param string $name The name of the method.
	 * @param array  $arguments The arguments to pass to the method.
	 *
	 * @throws Exception If the method is not found.
	 */
	public static function __callStatic( $name, $arguments ) {
		if ( method_exists( Image_CDN::class, $name ) ) {
			_deprecated_function( __CLASS__ . '::' . esc_html( $name ), 'jetpack-12.2', 'Automattic\Jetpack\Image_CDN\Image_CDN::' . esc_html( $name ) );
			return Image_CDN::$name( ...$arguments );
		} else {
			// Handle cases where the method is not found
			throw new Exception( sprintf( 'Undefined static method: %s', esc_html( $name ) ) );
		}
	}
}
