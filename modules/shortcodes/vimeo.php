<?php
/*
[vimeo 141358]
[vimeo http://vimeo.com/141358]
[vimeo 141358 h=500&w=350]
[vimeo id=141358 width=350 height=500]

<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo 'We Got More' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>
*/

function vimeo_shortcode( $atts ) {
	global $content_width;

	extract( array_map( 'intval', shortcode_atts( array(
		'id'     => 0,
		'width'  => 400,
		'height' => 300
	), $atts ) ) );

	if ( isset( $atts[0] ) ) {
		$atts[0] = trim( $atts[0] , '=' );
		if ( is_numeric( $atts[0] ) )
			$id = (int) $atts[0];
		elseif ( preg_match( '|vimeo.com/(\d+)/?$|i', $atts[0], $match ) )
			$id = (int) $match[1];
	}

	// [vimeo 141358 h=500&w=350]
	$params = shortcode_new_to_old_params( $atts ); // h=500&w=350
	$params = str_replace( array( '&amp;', '&#038;' ), '&', $params );
	parse_str( $params, $args );

	if ( isset( $args['w'] ) ) 
		$width = (int) $args['w'];

	if ( isset( $args['h'] ) )
		$height = (int) $args['h'];

	if ( ! $width )
		$width = absint( $content_width );

	if ( ! $height )
		$height = round( ( $width / 640 ) * 360 );

	if ( ! $id ) return "<!-- vimeo error: not a vimeo video -->";

	return <<<EOS
<div style='text-align:center;'>
<object type="application/x-shockwave-flash" width="$width" height="$height" data="http://www.vimeo.com/moogaloop.swf?clip_id=$id&amp;server=www.vimeo.com&amp;fullscreen=1&amp;show_title=1&amp;show_byline=0&amp;show_portrait=0&amp;color=01AAEA">
	<param name="quality" value="best" />
	<param name="allowfullscreen" value="true" />
	<param name="scale" value="showAll" />
	<param name="movie" value="http://www.vimeo.com/moogaloop.swf?clip_id=$id&amp;server=www.vimeo.com&amp;fullscreen=1&amp;show_title=1&amp;show_byline=0&amp;show_portrait=0&amp;color=01AAEA" />
	<param name="wmode" value="opaque" />
</object>
</div>
EOS;
}

add_shortcode( 'vimeo', 'vimeo_shortcode' );

function vimeo_embed_to_shortcode( $content ) {
	if ( false === stripos( $content, 'player.vimeo.com/video/' ) ) 
		return $content;

	$regexp = '!<iframe\s+src="http://player.vimeo.com/video/(\d+)"((?:\s+\w+="[^"]*")*)></iframe>!i';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) ); 
  
	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) { 
		if ( !preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			$id = (int) $match[1];

			$params = $match[2];

			if ( 'regexp_ent' == $reg ) 
				$params = html_entity_decode( $params );

			$params = wp_kses_hair( $params, array( 'http' ) );

			$width = isset ($params['width']) ? (int) $params['width']['value'] : 0;
			$height = isset ($params['height']) ? (int) $params['height']['value'] : 0;

			$wh = '';
			if ( $width && $height ) 
				$wh = ' w=' . $width . ' h=' . $height; 

			$shortcode = '[vimeo ' . $id . $wh . ']';
			$content = str_replace( $match[0], $shortcode, $content );
		}
	}

	return $content;
}

add_filter( 'pre_kses', 'vimeo_embed_to_shortcode' );