<?php
// shortcode handler for [bandcamp], which inserts a bandcamp.com
// music player (embedded flash object)
//
// [bandcamp album=119385304]
// [bandcamp album=3462839126  bgcol=FFFFFF linkcol=4285BB size=venti]
// [bandcamp track=2446959313]
//
function shortcode_handler_bandcamp( $atts ) {
	// there are no default values, but specify here anyway
	// to explicitly list supported atts
	$attributes = shortcode_atts( array(
		'album'			=> null,		// integer album id
		'track'			=> null,		// integer track id
		'size'			=> 'venti',		// one of the supported sizes
		'bgcol'			=> 'FFFFFF',	// hex, no '#' prefix
		'linkcol'		=> null,		// hex, no '#' prefix
		'layout'		=> null,		// encoded layout url
		'width'			=> null,		// integer with optional "%"
		'height'		=> null,		// integer with optional "%"
		'notracklist'	=> null,		// may be string "true" (defaults false)
		'tracklist'		=> null,		// may be string "false" (defaults true)
		'artwork'		=> null,		// may be string "false" (alternately: "none") or "small" (default is large)
		'minimal'		=> null,		// may be string "true" (defaults false)
		'theme'			=> null,		// may be theme identifier string ("light"|"dark" so far)
		'package'		=> null,		// integer package id
		't'				=> null			// integer track number
	), $atts );

	$sizes = array(
		'venti'			=> array( 'width' => 400, 'height' => 100 ),
		'grande'		=> array( 'width' => 300, 'height' => 100 ),
		'grande2'		=> array( 'width' => 300, 'height' => 355 ),
		'grande3'		=> array( 'width' => 300, 'height' => 415 ),
		'tall_album'	=> array( 'width' => 150, 'height' => 295 ),
		'tall_track'	=> array( 'width' => 150, 'height' => 270 ),
		'tall2'			=> array( 'width' => 150, 'height' => 450 ),
		'short'			=> array( 'width' => 46, 'height' => 23 ),
		'large'			=> array( 'width' => 350, 'height' => 470 ),
		'medium'		=> array( 'width' => 450, 'height' => 120 ),
		'small'			=> array( 'width' => 350, 'height' => 42 )
	);

	$sizekey = $attributes['size'];
	$height = null;
	$width = null;

	// Build iframe url.  Args are appended as
	// extra path segments for historical reasons having to
	// do with an IE-only flash bug which required this URL
	// to contain no querystring

	if ( !isset( $attributes['album'] ) && !isset( $attributes['track'] ) ) {
		return "[bandcamp: shortcode must include track or album id]";
	}

	$url = "//bandcamp.com/EmbeddedPlayer/v=2";
	if ( isset( $attributes['track'] ) ) {
		$track = (int) $attributes['track'];
		$url .= "/track={$track}";
	}
	if ( isset( $attributes['album'] ) ) {
		$album = (int) $attributes['album'];
		$url .= "/album={$album}";
	}

	if ( $sizekey == 'tall' ) {
		if ( isset( $attributes['album'] ) ) {
			$sizekey .= '_album';
		} else {
			$sizekey .= '_track';
		}
	}

	// if size specified that we don't recognize, fall back on venti
	if ( empty( $sizes[$sizekey] ) ) {
		$sizekey = 'venti';
		$attributes['size'] = 'venti';
	}

	// use strict regex for digits + optional % instead of absint for height/width
	// 'width' and 'height' params in the iframe url get the exact string from the shortcode
	// args, whereas the inline style attribute must have "px" added to it if it has no "%"
	if ( isset( $attributes['width'] ) && preg_match( "|^([0-9]+)(%)?$|", $attributes['width'], $matches ) ) {
		$width = $csswidth = $attributes['width'];
		if ( sizeof( $matches ) < 3 ) {
			$csswidth .= "px";
		}
	}
	if ( isset( $attributes['height'] ) && preg_match( "|^([0-9]+)(%)?$|", $attributes['height'], $matches ) ) {
		$height = $cssheight = $attributes['height'];
		if ( sizeof( $matches ) < 3 ) {
			$cssheight .= "px";
		}
	}

	if ( !$height ) {
		$height = $sizes[$sizekey]['height'];
		$cssheight = $height . "px";
	}

	if ( !$width ) {
		$width = $sizes[$sizekey]['width'];
		$csswidth = $width . "px";
	}

	if ( isset( $attributes['layout'] ) ) {
		$url .= "/layout={$attributes['layout']}";
	} elseif ( isset( $attributes['size'] ) && preg_match( "|^[a-zA-Z0-9]+$|", $attributes['size'] ) ) {
		$url .= "/size={$attributes['size']}";
	}

	if ( isset( $attributes['bgcol'] ) && preg_match( "|^[0-9A-Fa-f]+$|", $attributes['bgcol'] ) ) {
		$url .= "/bgcol={$attributes['bgcol']}";
	}

	if ( isset( $attributes['linkcol'] ) && preg_match( "|^[0-9A-Fa-f]+$|", $attributes['linkcol'] ) ) {
		$url .= "/linkcol={$attributes['linkcol']}";
	}

	if ( isset( $attributes['package'] ) && preg_match( "|^[0-9]+$|", $attributes['package'] ) ) {
		$url .= "/package={$attributes['package']}";
	}

	if ( isset( $attributes['t'] ) && preg_match( "|^[0-9]+$|", $attributes['t'] ) ) {
		$url .= "/t={$attributes['t']}";
	}

	if ( $attributes['notracklist'] == "true" ) {
		$url .= "/notracklist=true";
	}

	// 'tracklist' arg deprecates 'notracklist=true' to be less weird.  note, behavior
	// if both are specified is undefined
	switch ( $attributes['tracklist'] ) {
		case "false":
		case "none":
			$url .= "/tracklist=false";
			break;
	}

	switch ( $attributes['artwork'] ) {
		case "false":
		case "none":
		case "small":
			$url .= "/artwork=" . $attributes['artwork'];
			break;
	}

	if ( $attributes['minimal'] == "true" ) {
		$url .= "/minimal=true";
	}

	if ( isset( $attributes['theme'] ) && preg_match( "|^[a-zA-Z_]+$|", $attributes['theme'] ) ) {
		$url .= "/theme={$attributes['theme']}";
	}

	$url .= '/';

	return "<iframe width='" . esc_attr( $width ) . "' height='" . esc_attr( $height ) . "' style='position: relative; display: block; width: " . esc_attr( $csswidth ) . "; height: " . esc_attr( $cssheight ) . ";' src='" . esc_url( $url ) . "' allowtransparency='true' frameborder='0'></iframe>";
}

add_shortcode( 'bandcamp', 'shortcode_handler_bandcamp' );
