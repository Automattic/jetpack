<?php

/**
 * Google+ embeds
 */

define( 'JETPACK_GOOGLEPLUS_EMBED_REGEX', '#^https?://plus\.(sandbox\.)?google\.com/(u/\d+/)?([^/]+)/posts/([^/]+)$#' );

// Example URL: https://plus.google.com/114986219448604314131/posts/LgHkesWCmJo
// Alternate example: https://plus.google.com/u/0/100004581596612508203/posts/2UKwN67MBQs  (note the /u/0/)
wp_embed_register_handler( 'googleplus', JETPACK_GOOGLEPLUS_EMBED_REGEX, 'jetpack_googleplus_embed_handler' );

function jetpack_googleplus_embed_handler( $matches, $attr, $url ) {
	wp_enqueue_script( 'jetpack-gplus-api', 'https://apis.google.com/js/plusone.js', array(), null, true );
	return sprintf( '<div class="g-post" data-href="%s"></div>', esc_url( $url ) );
}

add_shortcode( 'googleplus', 'jetpack_googleplus_shortcode_handler' );

function jetpack_googleplus_shortcode_handler( $atts ) {
	global $wp_embed;

	if ( empty( $atts['url'] ) )
		return;

	if ( ! preg_match( JETPACK_GOOGLEPLUS_EMBED_REGEX, $atts['url'] ) )
		return;

	return $wp_embed->shortcode( $atts, $atts['url'] );
}
