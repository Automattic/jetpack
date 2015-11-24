<?php

// Embed support for Medium https://medium.com/p/3eaed64aed8a

/**
 * Faux-oembed support for Medium permalinks
 *
 * e.g.
 * https://medium.com/help-center
 * https://medium.com/@richroll
 */
wp_embed_register_handler( 'medium', '#^https?://medium.com/([a-zA-z0-9-_@]+)#', 'jetpack_embed_medium_oembed' );

function jetpack_embed_medium_oembed( $matches, $attr, $url ) {
	$attr = jetpack_embed_medium_args( $attr );
	$attr['url'] = $url;

	return jetpack_embed_medium_embed_html( $attr );
}

function jetpack_embed_medium_embed_html( $args ) {
	$args = jetpack_embed_medium_args( $args );

	if ( empty( $args['url'] ) ) {
		return;
	}

	$args['type'] = jetpack_embed_medium_get_embed_type( $args['url'] );

	return sprintf( '<script async src="https://static.medium.com/embed.js"></script><a class="m-%1$s" href="%2$s" data-width="%3$s" data-border="%4$s" data-collapsed="%5$s">View %1$s at Medium.com</a>', esc_attr( $args['type'] ), esc_url( $args['url'] ), esc_attr( $args['width'] ), esc_attr( $args['border'] ), esc_attr( $args['collapsed'] ) );
}

/**
 * Shortcode support that allows passing in URL
 *
 * [medium url="https://medium.com/help-center" width="100%" border="false" collapsed="true"]
 */
add_shortcode( 'medium', 'jetpack_embed_medium_shortcode' );

function jetpack_embed_medium_shortcode( $atts ) {
	$atts = jetpack_embed_medium_args( $atts );

	if ( ! empty( $atts['url'] ) ) {
		global $wp_embed;
		return $wp_embed->shortcode( $atts, $atts['url'] );
	}
}

function jetpack_embed_medium_get_embed_type( $url ) {
	$url_path = parse_url( $url, PHP_URL_PATH );
	if ( preg_match( '/^\/@[\.\w]+$/', $url_path ) ) {
		return 'profile';
	} else if ( preg_match( '/^\/[\da-zA-Z-]+$/', $url_path ) ) {
		return 'collection';
	}

	return 'story';
}

function jetpack_embed_medium_args( $atts ) {
	return shortcode_atts( array(
		'url' => '',
		'width' => '400',
		'border' => true,
		'collapsed' => false,
	), $atts, 'medium' );
}
