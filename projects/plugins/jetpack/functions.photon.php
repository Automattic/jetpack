<?php
/**
 * Generic functions using the Photon service.
 *
 * Some are used outside of the Photon module being active, so intentionally not within the module.
 * As photon has been moved to the image-cdn package, the functions are now also replaced by their counterparts in Image_CDN_Core in the package.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Image_CDN\Image_CDN;
use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

/**
 * Generates a Photon URL.
 *
 * @see https://developer.wordpress.com/docs/photon/
 *
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url instead.
 * @param string       $image_url URL to the publicly accessible image you want to manipulate.
 * @param array|string $args An array of arguments, i.e. array( 'w' => '300', 'resize' => array( 123, 456 ) ), or in string form (w=123&h=456).
 * @param string|null  $scheme URL protocol.
 * @return string The raw final URL. You should run this through esc_url() before displaying it.
 */
function jetpack_photon_url( $image_url, $args = array(), $scheme = null ) {
	return Image_CDN_Core::cdn_url( $image_url, $args, $scheme );
}

/**
 * Parses WP.com-hosted image args to replicate the crop.
 *
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN_Core::parse_wpcom_query_args instead.
 * @param mixed  $args Args set during Photon's processing.
 * @param string $image_url URL of the image.
 * @return array|string Args for Photon to use for the URL.
 */
function jetpack_photon_parse_wpcom_query_args( $args, $image_url ) {
	return Image_CDN_Core::parse_wpcom_query_args( $args, $image_url );
}

/**
 * Sets the scheme for a URL
 *
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url_scheme instead.
 * @param string $url URL to set scheme.
 * @param string $scheme Scheme to use. Accepts http, https, network_path.
 *
 * @return string URL.
 */
function jetpack_photon_url_scheme( $url, $scheme ) {
	_deprecated_function( __FUNCTION__, 'jetpack-12.2', 'Automattic\Jetpack\Image_CDN\Image_CDN_Core::cdn_url_scheme' );
	return Image_CDN_Core::cdn_url_scheme( $url, $scheme );
}

/**
 * Check to skip Photon for a known domain that shouldn't be Photonized.
 *
 * @deprecated 12.2 Use Automattic\Jetpack\Image_CDN\Image_CDN_Core::banned_domains instead.
 * @param bool   $skip If the image should be skipped by Photon.
 * @param string $image_url URL of the image.
 *
 * @return bool Should the image be skipped by Photon.
 */
function jetpack_photon_banned_domains( $skip, $image_url ) {
	_deprecated_function( __FUNCTION__, 'jetpack-12.2', 'Automattic\Jetpack\Image_CDN\Image_CDN_Core::banned_domains' );
	return Image_CDN_Core::banned_domains( $skip, $image_url );
}

/**
 * Jetpack Photon - Support Text Widgets.
 *
 * @deprecated 12.2
 * @access public
 * @param string $content Content from text widget.
 * @return string
 */
function jetpack_photon_support_text_widgets( $content ) {
	_deprecated_function( __FUNCTION__, 'jetpack-12.2' );
	return Image_CDN::filter_the_content( $content );
}
