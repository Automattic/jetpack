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

	if ( empty( $doc ) || preg_match( $pattern, $doc ) ) {
		return '<!-- SlideShare error: doc is missing or has illegal characters -->';
	}

	if ( empty( $w ) && !empty( $content_width ) ) {
		$w = intval( $content_width );
	} elseif ( ! ( $w = intval( $w ) ) || $w < 300 || $w > 1600 ) {
		$w = 425;
	} else {
		$w = intval( $w );
	}

	$h = ceil( $w * 348 / 425 );

	$player = "<object type='application/x-shockwave-flash' wmode='opaque' data='http://static.slideshare.net/swf/ssplayer2.swf?id=$id&doc=$doc' width='$w' height='$h'><param name='movie' value='http://static.slideshare.net/swf/ssplayer2.swf?id=$id&doc=$doc' /><param name='allowFullScreen' value='true' /></object>";

	if ( !empty( $type ) && $type == 'd' ) {
		$player = "<object style='margin: 0px;' width='$w' height='$h'><param name='movie' value='http://static.slidesharecdn.com/swf/ssplayerd.swf?doc=$doc' /><param name='allowFullScreen' value='true' /><param name='wmode' value='opaque' /><embed src='http://static.slidesharecdn.com/swf/ssplayerd.swf?doc=$doc' type='application/x-shockwave-flash' allowfullscreen='true' wmode='opaque' width='$w' height='$h'></embed></object>";
	}

	return $player;
}

add_shortcode( 'slideshare', 'slideshare_shortcode' );
