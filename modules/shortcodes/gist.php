<?php

/**
 * GitHub's Gist site supports oEmbed but their oembed provider only
 * returns raw HTML (no styling) and the first little bit of the code.
 *
 * Their Javascript-based embed method is a lot better, so that's what we're using.
 */
wp_embed_register_handler( 'github-gist', '#https?://gist\.github\.com/([a-zA-Z0-9]+)#', 'github_gist_embed_handler' );
add_shortcode( 'gist', 'github_gist_shortcode' );

function github_gist_embed_handler( $matches, $attr, $url, $rawattr ) {
	// Let the shortcode callback do all the work
	return github_gist_shortcode( $attr, $url );
}

function github_gist_shortcode( $atts, $content = '' ) {

	if ( empty( $atts[0] ) && empty( $content ) )
		return '<!-- Missing Gist ID -->';

	$id = ( ! empty( $content ) ) ? $content : $atts[0];

	// Parse a URL
	if ( ! is_numeric( $id ) )
		$id = preg_replace( '#https?://gist.github.com/([a-zA-Z0-9]+)#', '$1', $id );

	if ( ! $id )
		return '<!-- Invalid Gist ID -->';

	$embed_url = "https://gist.github.com/{$id}.js";

	if ( ! empty( $atts['file'] ) )
		$embed_url = add_query_arg( 'file', urlencode( $atts['file'] ), $embed_url );
	// inline style to prevent the bottom margin to the embed that themes like TwentyTen, et al., add to tables
	return '<style>.gist table { margin-bottom: 0; }</style>' . '<script src="' . esc_url( $embed_url ) . '"></script>';
}