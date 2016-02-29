<?php

/**
 * GitHub's Gist site supports oEmbed but their oembed provider only
 * returns raw HTML (no styling) and the first little bit of the code.
 *
 * Their JavaScript-based embed method is a lot better, so that's what we're using.
 */
wp_embed_register_handler( 'github-gist', '#https?://gist\.github\.com/([a-zA-Z0-9]+)#', 'github_gist_embed_handler' );
add_shortcode( 'gist', 'github_gist_shortcode' );

function github_gist_embed_handler( $matches, $attr, $url, $rawattr ) {
	wp_enqueue_script( 'jetpack-gist-embed', plugins_url( 'js/gist.js', __FILE__ ), array( 'jquery' ), false, true );

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

	if ( ! empty( $atts['file'] ) ) {
		$file = '?file=' . urlencode( $atts['file'] );
	} else {
		$file = '';
	}

	$embed_url = "{$id}.json" . $file;

	// inline style to prevent the bottom margin to the embed that themes like TwentyTen, et al., add to tables
	$return = '<style>.gist table { margin-bottom: 0; }</style>' .
			  '<div class="gist-oembed" data-gist="' . esc_attr( $embed_url ) . '"></div>';

	if ( isset( $_POST[ 'type' ]) && 'embed' === $_POST[ 'type' ] &&
			isset( $_POST[ 'action' ] ) && 'parse-embed' === $_POST['action'] ) {

		return github_gist_simple_embed( $id, $file );
	}

	return  $return;
}

function github_gist_simple_embed( $id, $file ) {
	$embed_url = $id . '.js' . $file;

	return '<script type="text/javascript" src="//gist.github.com/' . $embed_url . '"></script>';
}