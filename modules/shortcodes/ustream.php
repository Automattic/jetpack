<?php

/**
 * ustream.tv shortcode
 *
 * Example:
 * [ustream id=1524 live=1]
 * [ustreamsocial id=12980237 width="500"]
 *
 * Embed code example, from http://www.ustream.tv/leolaporte
 * <iframe src="http://www.ustream.tv/embed/recorded/1524?v=3&#038;wmode=direct" width="480" height="296" scrolling="no" frameborder="0" style="border: 0 none transparent;"></iframe>
 */

add_shortcode( 'ustream', 'ustream_shortcode' );
add_shortcode( 'ustreamsocial', 'ustreamsocial_shortcode' );

/**
 * Parse shortcode arguments and render output for ustream single video.
 *
 * @since 4.5.0
 *
 * @param $atts array of user-supplied arguments.
 *
 * @return string HTML output.
 */
function ustream_shortcode( $atts ) {
	if ( isset( $atts[0] ) ) {
		return '<!-- ustream error: bad parameters -->';
	}

	$defaults = array(
		'width'     => 480,
		'height'    => 296,
		'id'        => 0,
		'live'      => 0,
		'highlight' => 0,
		'version'   => 3,
		'hwaccel'   => 1,
	);

	$atts = array_map( 'intval', shortcode_atts( $defaults, $atts ) );

	$ustream_id = $atts['id'];
	$width      = $atts['width'];
	$height     = $atts['height'];
	$live       = $atts['live'];
	$highlight  = $atts['highlight'];
	$version    = $atts['version'];
	$hwaccel    = $atts['hwaccel'];

	$version = 'v=' . esc_attr( $version );

	if ( 0 >= $ustream_id ) {
		return '<!-- ustream error: bad video ID -->';
	}

	if ( 0 >= $height ) {
		return '<!-- ustream error: height invalid -->';
	}

	if ( 0 >= $width ) {
		return '<!-- ustream error: width invalid -->';
	}

	if ( $live ) {
		$recorded = '';
	} else {
		$recorded = 'recorded/';
	}

	if ( ! $live && ( 0 < $highlight ) ) {
		$highlight = "/highlight/$highlight";
	} else {
		$highlight = '';
	}

	if ( 0 < $hwaccel ) {
		$wmode = '&amp;wmode=direct';
	} else {
		$wmode = '';
	}

	$url    = 'http://www.ustream.tv/embed/' . $recorded . esc_attr( $ustream_id ) . $highlight . '?' . $version . $wmode;
	$url    = set_url_scheme( $url );
	$output = '<iframe src="' . esc_url( $url ) . '" width="' . esc_attr( $width ) . '" height="' . esc_attr( $height ) . '" scrolling="no" style="border: 0 none transparent;"></iframe>';

	return $output;
}

/**
 * Parse shortcode arguments and render output for ustream's Social Stream.
 *
 * @since 4.5.0
 *
 * @param $atts array of user-supplied arguments.
 *
 * @return string HTML output.
 */
function ustreamsocial_shortcode( $atts ) {
	$defaults = array(
		'id'     => 0,
		'height' => 420,
		'width'  => 320,
	);

	$atts = array_map( 'intval', shortcode_atts( $defaults, $atts ) );

	$ustream_id = $atts['id'];
	$width      = $atts['width'];
	$height     = $atts['height'];

	if ( 0 >= $ustream_id ) {
		return '<!-- ustreamsocial error: bad social stream ID -->';
	}

	if ( 0 >= $height ) {
		return '<!-- ustreamsocial error: height invalid -->';
	}

	if ( 0 >= $width ) {
		return '<!-- ustreamsocial error: width invalid -->';
	}

	$url = set_url_scheme( "http://www.ustream.tv/socialstream/$ustream_id" );

	return '<iframe id="SocialStream" class="" name="SocialStream" width="' . esc_attr( $width ) . '" height="' . esc_attr( $height ) . '" scrolling="no" allowtransparency="true" src="' . esc_url( $url ) . '" style="visibility: visible; margin-top: 0; margin-bottom: 0; border: 0;"></iframe>';
}
