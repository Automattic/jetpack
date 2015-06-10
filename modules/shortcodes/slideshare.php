<?php
/*
 * Slideshare shortcode format:
 * [slideshare id=5342235&doc=camprock-101002163655-phpapp01&w=300&h=200]
 **/

function slideshare_shortcode( $atts ) {
	global $content_width;

	$params = shortcode_new_to_old_params( $atts );
	parse_str( $params, $arguments );

	if ( empty( $arguments ) ) {
		return '<!-- SlideShare error: no arguments -->';
	}

	extract( $arguments, EXTR_SKIP );

	$pattern = '/[^-_a-zA-Z0-9]/';
	if ( empty( $id ) || preg_match( $pattern, $id ) ) {
		return '<!-- SlideShare error: id is missing or has illegal characters -->';
	}

	if ( empty( $w ) && !empty( $content_width ) ) {
		$w = intval( $content_width );
	} elseif ( ! ( $w = intval( $w ) ) || $w < 300 || $w > 1600 ) {
		$w = 425;
	} else {
		$w = intval( $w );
	}

	$h = ceil( $w * 348 / 425 );

	if ( isset( $pro ) ) {
		$source = "https://www.slideshare.net/slidesharepro/$id";
	} else {
		$source = "https://www.slideshare.net/slideshow/embed_code/$id";
	}

	if ( isset( $rel ) )
		$source = add_query_arg( 'rel', intval( $rel ), $source );

	if ( isset( $startSlide ) )
		$source = add_query_arg( 'startSlide', intval( $startSlide ), $source );

	$player = sprintf( "<iframe src='%s' width='%d' height='%d'", esc_url( $source ), $w, $h );

	// check the frameborder 
	if ( isset( $fb ) )
		$player .= " frameborder='" . intval( $fb ) . "'";

	// check the margin width; if not empty, cast as int 
	if ( isset( $mw ) )
		$player .= " marginwidth='" . intval( $mw ) . "'";

	// check the margin height, if not empty, cast as int 
	if ( isset( $mh ) )
		$player .= " marginheight='" . intval( $mh ) . "'";

	if ( ! empty( $style ) )
		$player .= " style='" . $style . "'";

	// check the scrollbar; cast as a lowercase string for comparison 
	$sc = isset( $sc ) ? strtolower( $sc ) : '';

	if ( in_array( $sc, array( 'yes', 'no' ) ) )
		$player .= " scrolling='" . $sc . "'";

	$player .= ' allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe>';

	return $player;
}

add_shortcode( 'slideshare', 'slideshare_shortcode' );