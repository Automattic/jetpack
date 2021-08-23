<?php
/**
 * Spotify shortcode.
 *
 * Usage:
 * [spotify id="spotify:track:4bz7uB4edifWKJXSDxwHcs" width="400" height="100"]
 *
 * @package automattic/jetpack
 */

if ( ! shortcode_exists( 'spotify' ) ) {
	add_shortcode( 'spotify', 'jetpack_spotify_shortcode' );
}

/**
 * Parse shortcode arguments and render its output.
 *
 * @since 4.5.0
 *
 * @param array  $atts    Shortcode attributes.
 * @param string $content Post Content.
 *
 * @return string
 */
function jetpack_spotify_shortcode( $atts = array(), $content = '' ) {

	if ( ! empty( $content ) ) {
		$id = $content;
	} elseif ( ! empty( $atts['id'] ) ) {
		$id = $atts['id'];
	} elseif ( ! empty( $atts[0] ) ) {
		$id = $atts[0];
	} else {
		return '<!-- Missing Spotify ID -->';
	}

	if ( empty( $atts['width'] ) ) {
		$atts['width'] = 300;
	}

	if ( empty( $atts['height'] ) ) {
		$atts['height'] = 380;
	}

	$atts['width']  = (int) $atts['width'];
	$atts['height'] = (int) $atts['height'];

	// Spotify accepts both URLs and their Spotify ID format, so let them sort it out and validate.
	$embed_url = add_query_arg( 'uri', rawurlencode( $id ), 'https://embed.spotify.com/' );

	return '<iframe src="' . esc_url( $embed_url ) . '" style="display:block; margin:0 auto; width:' . esc_attr( $atts['width'] ) . 'px; height:' . esc_attr( $atts['height'] ) . 'px;" frameborder="0" allowtransparency="true" loading="lazy"></iframe>';
}

/**
 * Turn text like this on it's own line into an embed: spotify:track:4bz7uB4edifWKJXSDxwHcs
 * The core WordPress embed functionality only works with URLs
 * Modified version of WP_Embed::autoembed()
 *
 * @since 4.5.0
 *
 * @param string $content Post content.
 *
 * @return string
 */
function jetpack_spotify_embed_ids( $content ) {
	$textarr = wp_html_split( $content );

	foreach ( $textarr as &$element ) {
		if ( '' === $element || '<' === $element[0] ) {
			continue;
		}

		// If this element does not contain a Spotify embed, continue.
		if ( false === strpos( $element, 'spotify:' ) ) {
			continue;
		}

		$element = preg_replace_callback( '|^\s*(spotify:[^\s"]+:[^\s"]+)\s*$|im', 'jetpack_spotify_embed_ids_callback', $element );
	}

	return implode( '', $textarr );
}
add_filter( 'the_content', 'jetpack_spotify_embed_ids', 7 );

/**
 * Call shortcode with ID provided by matching pattern.
 *
 * @since 4.5.0
 *
 * @param array $matches Array of matches for Spofify links.
 *
 * @return string
 */
function jetpack_spotify_embed_ids_callback( $matches ) {
	return "\n" . jetpack_spotify_shortcode( array(), $matches[1] ) . "\n";
}
