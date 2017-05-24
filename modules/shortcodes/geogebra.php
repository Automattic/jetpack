<?php
/**
 * Geogebra embeds
 *
 * @link https://www.geogebra.org/
 *
 * @package Jetpack
 * @module shortcodes
 * @since TODO
 */

add_shortcode( 'geogebra', 'geogebra_shortcode_handler' );

/**
 * Constructs a GeoGebra embed iframe. There is no official API doc for this,
 * but the URL format is simple to reverse engineer from the embed code generated
 * by tube.geogebra.org.
 *
 * @module shortcodes
 * @since TODO
 *
 * @param array $attr Array of shortcode attributes.
 *
 * @return string The iframe element.
 */
function geogebra_shortcode_handler( $attr ) {

	if ( ! isset( $attr['id'] ) ) {
		return '<!-- Missing GeoGebra Applet ID -->';
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

	$embed_url  = 'https://www.geogebra.org/material/iframe/id/' . $keyval['id'];
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

/**
 * Replace embedded geogebra iframes with shortcodes.
 *
 * @module shortcodes
 * @since TODO
 *
 * @param string $content String to replace iframes in.
 *
 * @return string String with iframes replaced.
 */
function geogebra_embed_to_shortcode( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'geogebra.org/material' ) ) {
		return $content;
	}

	$regex = '%(<iframe[^>]*?src="https://www.geogebra.org/material/[^>]*>[^<]*<\/iframe>)%';

	if ( ! preg_match_all( $regex, $content, $matches, PREG_SET_ORDER ) ) {
		return $content;
	}

	foreach ( $matches as $match ) {

		$shortcode = '[geogebra';

		$id_regex = '%/id/([^/]*)/%';
		if ( ! preg_match( $id_regex, $match[0], $id_match ) ) {
			return $content;
		} else {
			$shortcode .= ' id="' . $id_match[1] . '"';
		}

		$height_regex = '%/height/([0-9]*)/%';
		if ( ! preg_match( $height_regex, $match[0], $height_match ) ) {
			return $content;
		} else {
			$shortcode .= ' height="' . $height_match[1] . '"';
		}

		$width_regex = '%/width/([0-9]*)/%';
		if ( ! preg_match( $width_regex, $match[0], $width_match ) ) {
			return $content;
		} else {
			$shortcode .= ' width="' . $width_match[1] . '"';
		}

		if ( false !== strpos( $match[0], '/ai/true' ) ) {
			$shortcode .= ' input-bar="true"';
		}

		if ( false !== strpos( $match[0], '/asb/true' ) ) {
			$shortcode .= ' style-bar="true"';
		}

		if ( false !== strpos( $match[0], '/smb/true' ) ) {
			$shortcode .= ' menu-bar="true"';
		}

		if ( false !== strpos( $match[0], '/stb/true' ) ) {
			$shortcode .= ' tool-bar="true"';

			if ( false !== strpos( $match[0], '/stbh/true' ) ) {
				$shortcode .= ' tool-help="true"';
			}
		}

		if ( false !== strpos( $match[0], '/sri/true' ) ) {
			$shortcode .= ' reset-icon="true"';
		}

		if ( false !== strpos( $match[0], '/rc/true' ) ) {
			$shortcode .= ' right-click="true"';
		}

		if ( false !== strpos( $match[0], '/ld/true' ) ) {
			$shortcode .= ' drag-labels="true"';
		}

		if ( false !== strpos( $match[0], '/sdz/true' ) ) {
			$shortcode .= ' pan-zoom="true"';
		}

		$shortcode .= ']';

		$content = str_replace( $match[0], $shortcode, $content );
	}

	return $content;
}

add_filter( 'pre_kses', 'geogebra_embed_to_shortcode' );
