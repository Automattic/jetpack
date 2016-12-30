<?php
/**
 * Geogebra embeds
 *
 * @link https://www.geogebra.org/
 *
 * @package Jetpack
 */

add_shortcode( 'geogebra', 'geogebra_shortcode_handler' );

/**
 * Constructs a GeoGebra embed iframe. There is no official API doc for this,
 * but the URL format is simple to reverse engineer from the embed code generated
 * by tube.geogebra.org.
 *
 * @param array $attr Array of shortcode attributes.
 *
 * @return string The iframe element.
 */
function geogebra_shortcode_handler( $attr ) {

	if ( ! isset( $attr['id'] ) ) {
		return 'Geogebra shortcode: must provide an id!';
	}

	$keyval = shortcode_atts(
		array(
			'id'          => null,
			'height'      => 480,
			'width'       => 640,
			'border'      => '888888',
			'input-bar'   => null,
			'style-bar'   => null,
			'menu-bar'    => null,
			'tool-bar'    => null,
			'tool-help'   => null,
			'reset-icon'  => null,
			'right-click' => null,
			'drag-labels' => null,
			'pan-zoom'    => null,
		),
		$attr
	);

	$embed_url  = 'http://www.geogebra.org/material/iframe/id/' . $keyval['id'];
	$embed_url .= '/height/' . $keyval['height'];
	$embed_url .= '/width/' . $keyval['width'];
	$embed_url .= '/border/' . $keyval['border'];

	if ( 'true' === $keyval['input-bar'] ) {
		$embed_url .= '/ai/true';
	}

	if ( 'true' === $keyval['style-bar'] ) {
		$embed_url .= '/asb/true';
	}

	if ( 'true' === $keyval['menu-bar'] ) {
		$embed_url .= '/smb/true';
	}

	if ( 'true' === $keyval['tool-bar'] ) {
		$embed_url .= '/stb/true';

		if ( 'true' === $keyval['tool-help'] ) {
			$embed_url .= '/stbh/true';
		}
	}

	if ( 'true' === $keyval['reset-icon'] ) {
		$embed_url .= '/sri/true';
	}

	if ( 'true' === $keyval['right-click'] ) {
		$embed_url .= '/rc/true';
	}

	if ( 'true' === $keyval['drag-labels'] ) {
		$embed_url .= '/ld/true';
	}

	if ( 'true' === $keyval['pan-zoom'] ) {
		$embed_url .= '/sdz/true';
	}

	$content  = '<iframe';
	$content .= ' scrolling="no"';
	$content .= ' src="' . $embed_url . '"';
	$content .= ' height="' . $keyval['height'] . 'px"';
	$content .= ' width="' . $keyval['width'] . 'px"';
	$content .= '></iframe>';

	return $content;
}
