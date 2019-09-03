<?php
/**
 * Map block.
 *
 * @since 6.8.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/map',
	array(
		'render_callback' => 'jetpack_map_block_load_assets',
	)
);

/**
 * Map block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the map block attributes.
 * @param string $content String containing the map block content.
 *
 * @return string
 */
function jetpack_map_block_load_assets( $attr, $content ) {
	$api_key = Jetpack_Options::get_option( 'mapbox_api_key' );

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		global $wp, $map_block_counter;
		if ( ! $map_block_counter ) {
			$map_block_counter = 1;
		}
		$iframe_url = home_url( $wp->request ) . '?map-block-counter=' . $map_block_counter;

		$map_block_counter++;

		$placeholder = preg_replace( '/(?<=<div\s)/', 'placeholder ', $content );

		// @todo Is intrinsic size right? Is content_width the right dimensions?
		return sprintf(
			'<amp-iframe src="%s" width="%d" height="%d" layout="intrinsic" allowfullscreen sandbox="allow-scripts">%s</amp-iframe>',
			esc_url( $iframe_url ),
			Jetpack::get_content_width(),
			Jetpack::get_content_width(),
			$placeholder
		);
	}

	Jetpack_Gutenberg::load_assets_as_required( 'map' );

	return preg_replace( '/<div /', '<div data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 );
}

/**
 * Render a page containing only a single Map block.
 */
function jetpack_map_block_render_single_block_page() {
	$map_block_counter = (int) filter_input( INPUT_GET, 'map-block-counter', FILTER_SANITIZE_NUMBER_INT );
	if ( ! $map_block_counter ) {
		return;
	}

	/* Create an array of all root-level DIVs that are Map Blocks */
	global $post;

	$post_html = new DOMDocument();
	$post_html->loadHTML( $post->post_content );
	$xpath          = new DOMXPath( $post_html );
	$map_block_divs = $xpath->query( '//div[ contains( @class, "wp-block-jetpack-map" ) ]' );

	/* Check that we have a block matching the counter position */
	if ( ! isset( $map_block_divs[ $map_block_counter - 1 ] ) ) {
		return;
	}

	/* Compile scripts and styles */
	ob_start();

	add_filter( 'jetpack_is_amp_request', '__return_false' );

	Jetpack_Gutenberg::load_assets_as_required( 'map' );
	wp_scripts()->do_items();
	wp_styles()->do_items();

	add_filter( 'jetpack_is_amp_request', '__return_true' );

	$head_content = ob_get_clean();

	/* Put together a new complete document containing only the requested block markup and the scripts/styles needed to render it */
	$block_markup = $post_html->saveHTML( $map_block_divs[ $map_block_counter - 1 ] );
	$api_key      = Jetpack_Options::get_option( 'mapbox_api_key' );
	$page_html    = sprintf(
		'<!DOCTYPE html><head><style>html, body { margin: 0; padding: 0; }</style>%s</head><body>%s</body>',
		$head_content,
		preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $api_key ) . '" ', $block_markup, 1 )
	);
	echo $page_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}

add_action( 'wp', 'jetpack_map_block_render_single_block_page' );
