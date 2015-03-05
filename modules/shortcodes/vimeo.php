<?php

/*
[vimeo 141358]
[vimeo http://vimeo.com/141358]
[vimeo 141358 h=500&w=350]
[vimeo id=141358 width=350 height=500]

<iframe src="http://player.vimeo.com/video/18427511" width="400" height="225" frameborder="0"></iframe><p><a href="http://vimeo.com/18427511">Eskmo 'We Got More' (Official Video)</a> from <a href="http://vimeo.com/ninjatune">Ninja Tune</a> on <a href="http://vimeo.com">Vimeo</a>.</p>
*/

function jetpack_shortcode_get_vimeo_id( $atts ) {
	if ( isset( $atts[0] ) ) {
		$atts[0] = trim( $atts[0] , '=' );
		$id = false;
		if ( is_numeric( $atts[0] ) )
			$id = (int) $atts[0];
		elseif ( preg_match( '|vimeo\.com/(\d+)/?$|i', $atts[0], $match ) )
			$id = (int) $match[1];
		elseif ( preg_match( '|player\.vimeo\.com/video/(\d+)/?$|i', $atts[0], $match ) )
			$id = (int) $match[1];
		return $id;
	}
	return 0;
}

/**
 * Convert a Vimeo shortcode into an embed code.
 *
 * @param array $atts An array of shortcode attributes.
 * @return string The embed code for the Vimeo video.
 */
function vimeo_shortcode( $atts ) {
	global $content_width;

	extract( array_map( 'intval', shortcode_atts( array(
		'id'       => 0,
		'width'    => 400,
		'height'   => 300,
		'autoplay' => 0,
		'loop'     => 0,
	), $atts, 'vimeo' ) ) );

	if ( isset( $atts[0] ) ) {
		$id = jetpack_shortcode_get_vimeo_id( $atts );
	}

	if ( ! $id ) return "<!-- vimeo error: not a vimeo video -->";

	// [vimeo 141358 h=500&w=350]
	$params = shortcode_new_to_old_params( $atts ); // h=500&w=350
	$params = str_replace( array( '&amp;', '&#038;' ), '&', $params );
	parse_str( $params, $args );

	if ( isset( $args['w'] ) ) {
		$width = (int) $args['w'];

		if ( ! isset( $args['h'] ) ) {
			// The case where w=300 is specified without h=200, otherwise $height
			// will always equal the default of 300, no matter what w was set to.
			$height = round( ( $width / 640 ) * 360 );
		}
	}

	if ( isset( $args['h'] ) ) {
		$height = (int) $args['h'];

		if ( ! isset( $args['w'] ) ) {
			$width = round( ( $height / 360 ) * 640 );
		}
	}

	if ( ! $width ) {
		$width = absint( $content_width );
	}

	if ( ! $height ) {
		$height = round( ( $width / 640 ) * 360 );
	}
	
	/**
	 * Filter the Vimeo player width.
	 *
	 * @since 3.4.0
	 *
	 * @param int $width Width of the Vimeo player in pixels.
	 */
	$width = (int) apply_filters( 'vimeo_width', $width );
	
	/**
	 * Filter the Vimeo player height.
	 *
	 * @since 3.4.0
	 *
	 * @param int $height Height of the Vimeo player in pixels.
	 */
	$height = (int) apply_filters( 'vimeo_height', $height );

	$url = esc_url( set_url_scheme( "http://player.vimeo.com/video/$id" ) );

	// $args['autoplay'] is parsed from the embedded url.
	// $autoplay is parsed from shortcode arguments.
	// in_array( 'autoplay', $atts ) catches the argument passed without a value.
	if ( ! empty( $args['autoplay'] ) || ! empty( $autoplay ) || in_array( 'autoplay', $atts ) ) {
		$url = add_query_arg( 'autoplay', 1, $url );
	}

	if ( ! empty( $args['loop'] ) || ! empty( $loop ) || in_array( 'loop', $atts ) ) {
		$url = add_query_arg( 'loop', 1, $url );
	}

	$html = sprintf( '<div class="embed-vimeo" style="text-align:center;"><iframe src="%1$s" width="%2$u" height="%3$u" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe></div>', esc_url( $url ), $width, $height );
	
	/**
	 * Filter the Vimeo player HTML.
	 *
	 * @since 1.2.3
	 *
	 * @param string $html Embedded Vimeo player HTML.
	 */
	$html = apply_filters( 'video_embed_html', $html );
	
	return $html;
}

add_shortcode( 'vimeo', 'vimeo_shortcode' );

function vimeo_embed_to_shortcode( $content ) {
	if ( false === stripos( $content, 'player.vimeo.com/video/' ) )
		return $content;

	$regexp = '!<iframe\s+src=[\'"](https?:)?//player\.vimeo\.com/video/(\d+)[\w=&;?]*[\'"]((?:\s+\w+=[\'"][^\'"]*[\'"])*)((?:[\s\w]*))></iframe>!i';
	$regexp_ent = str_replace( '&amp;#0*58;', '&amp;#0*58;|&#0*58;', htmlspecialchars( $regexp, ENT_NOQUOTES ) );

	foreach ( array( 'regexp', 'regexp_ent' ) as $reg ) {
		if ( !preg_match_all( $$reg, $content, $matches, PREG_SET_ORDER ) )
			continue;

		foreach ( $matches as $match ) {
			$id = (int) $match[2];

			$params = $match[3];

			if ( 'regexp_ent' == $reg )
				$params = html_entity_decode( $params );

			$params = wp_kses_hair( $params, array( 'http' ) );

			$width = isset( $params['width'] ) ? (int) $params['width']['value'] : 0;
			$height = isset( $params['height'] ) ? (int) $params['height']['value'] : 0;

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
