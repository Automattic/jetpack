<?php
/*
 * WARNING: This file is distributed verbatim in Jetpack.
 * There should be nothing WordPress.com specific in this file.
 *
 * @hide-in-jetpack
 */

/*
[archiveorg-book goodytwoshoes00newyiala]
[archiveorg-book http://www.archive.org/stream/goodytwoshoes00newyiala]
[archiveorg id=goodytwoshoes00newyiala width=480 height=430]

<iframe src='https://www.archive.org/stream/goodytwoshoes00newyiala?ui=embed#mode/1up' width='480px' height='430px' frameborder='0' ></iframe>
*/

/**
 * Get ID of requested archive.org book embed.
 *
 * @since 4.5.0
 *
 * @param $atts
 *
 * @return int|string
 */
function jetpack_shortcode_get_archiveorg_book_id( $atts ) {
	if ( isset( $atts[0] ) ) {
		$atts[0] = trim( $atts[0] , '=' );
		if ( preg_match( '#archive.org/stream/(.+)/?$#i', $atts[0], $match ) ) {
			$id = $match[1];
		} else {
			$id = $atts[0];
		}
		return $id;
	}
	return 0;
}

/**
 * Convert an archive.org book shortcode into an embed code.
 *
 * @since 4.5.0
 *
 * @param array $atts An array of shortcode attributes.
 * @return string The embed code for the Archive.org book
 */
function jetpack_archiveorg_book_shortcode( $atts ) {
	global $content_width;

	if ( isset( $atts[0] ) && empty( $atts['id'] ) ) {
		$atts['id'] = jetpack_shortcode_get_archiveorg_book_id( $atts );
	}

	$atts = shortcode_atts( array(
		'id'       => '',
		'width'    => 480,
		'height'   => 430,
	), $atts );

	if ( ! $atts['id'] ) {
		return '<!-- error: missing archive.org book ID -->';
	}

	$id = $atts['id'];

	if ( ! $atts['width'] ) {
		$width = absint( $content_width );
	} else {
		$width = intval( $atts['width'] );
	}

	if ( ! $atts['height'] ) {
		$height = round( ( $width / 640 ) * 360 );
	} else {
		$height = intval( $atts['height'] );
	}

	$url = esc_url( set_url_scheme( "http://archive.org/stream/{$id}?ui=embed#mode/1up" ) );

	$html = "<div class='embed-archiveorg-book' style='text-align:center;'><iframe src='$url' width='$width' height='$height' style='border:0;' webkitallowfullscreen='true' mozallowfullscreen='true' allowfullscreen></iframe></div>";
	return $html;
}

add_shortcode( 'archiveorg-book', 'jetpack_archiveorg_book_shortcode' );

/**
 * Compose shortcode from archive.org book iframe.
 *
 * @since 4.5.0
 *
 * @param string $content
 *
 * @return mixed
 */
function jetpack_archiveorg_book_embed_to_shortcode( $content ) {
	if ( ! is_string( $content ) || false === stripos( $content, 'archive.org/stream/' ) ) {
		return $content;
	}

	$regexp = '!<iframe\s+src=[\'"](http|https)://(www.archive|archive)\.org/stream/([^\'"]+)[\'"]((?:\s+\w+(=[\'"][^\'"]*[\'"])?)*)\s></iframe>!i';

	if ( ! preg_match_all( $regexp, $content, $matches, PREG_SET_ORDER ) ) {
		return $content;
	}

	foreach ( $matches as $match ) {
		$url = explode( '?', $match[3] );
		$id = $url[0];

		$params = $match[4];

		$params = wp_kses_hair( $params, array( 'http' ) );

		$width = isset( $params['width'] ) ? absint( $params['width']['value'] ) : 0;
		$height = isset( $params['height'] ) ? absint( $params['height']['value'] ) : 0;

		$wh = '';
		if ( $width && $height ) {
			$wh = ' width=' . $width . ' height=' . $height;
		}

		$shortcode = '[archiveorg-book ' . $id . $wh . ']';
		$content = str_replace( $match[0], $shortcode, $content );
	}

	return $content;
}

add_filter( 'pre_kses', 'jetpack_archiveorg_book_embed_to_shortcode' );