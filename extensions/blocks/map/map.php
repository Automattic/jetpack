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

		// Get the original state.
		$scripts_queue = wp_scripts()->queue;
		$scripts_done  = wp_scripts()->done;
		$styles_queue  = wp_styles()->queue;
		$styles_done   = wp_styles()->done;

		// Empty out everything.
		wp_scripts()->queue = [];
		wp_scripts()->done  = [];
		wp_styles()->queue  = [];
		wp_styles()->done   = [];

		// Get what we need.
		ob_start();
		add_filter( 'jetpack_is_amp_request', '__return_false' );
		Jetpack_Gutenberg::load_assets_as_required( 'map' );
		wp_scripts()->do_items();
		wp_styles()->do_items();
		add_filter( 'jetpack_is_amp_request', '__return_true' );
		$assets_html = ob_get_clean();

		// Restore to the original state.
		wp_scripts()->queue = $scripts_queue;
		wp_scripts()->done  = $scripts_done;
		wp_styles()->queue  = $styles_queue;
		wp_styles()->done   = $styles_done;

		$html = sprintf(
			'<!DOCTYPE html><head><style>html, body { margin: 0; padding: 0; }</style>%s</head><body>%s</body>',
			$assets_html,
			preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 )
		);

		$placeholder = preg_replace( '/(?<=<div\s)/', 'placeholder ', $content );

		// @todo Is intrinsic size right? Is content_width the right dimensions?
		return sprintf(
			'<amp-iframe srcdoc="%s" width="%d" height="%d" layout="intrinsic" allowfullscreen sandbox="allow-scripts">%s</amp-iframe>',
			htmlspecialchars( $html ),
			Jetpack::get_content_width(),
			Jetpack::get_content_width(),
			$placeholder
		);

	} else {
		Jetpack_Gutenberg::load_assets_as_required( 'map' );

		return preg_replace( '/(?<=<div\s)/', 'data-api-key="' . esc_attr( $api_key ) . '" ', $content, 1 );
	}
}
