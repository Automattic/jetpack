<?php
/**
 * Chooses a transplanter for a MIME type.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Maps a MIME type to its concrete transplanter. Returns null for formats not
 * supported in v1 (only PNG and JPEG are).
 */
final class Transplanter_Factory {

	/**
	 * Choose a transplanter for a MIME type.
	 *
	 * @param string $mime MIME type such as `image/png`.
	 * @return Transplanter|null
	 */
	public function for_mime( $mime ) {
		switch ( $mime ) {
			case 'image/png':
				return new PNG_Transplanter();
			case 'image/jpeg':
				return new JPEG_Transplanter();
			default:
				return null;
		}
	}
}
