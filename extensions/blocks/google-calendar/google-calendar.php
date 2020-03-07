<?php
/**
 * Google Calendar Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

namespace Jetpack\Google_Calendar_Block;

const FEATURE_NAME = 'google-calendar';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => 'Jetpack\Google_Calendar_Block\load_assets',
		)
	);
}

add_action( 'init', 'Jetpack\Google_Calendar_Block\register_block' );

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array $attr Array containing the Google Calendar block attributes.
 * @return string
 */
function load_assets( $attr ) {
	$width   = isset( $attr['width'] ) ? $attr['width'] : '800';
	$height  = isset( $attr['height'] ) ? $attr['height'] : '600';
	$url     = isset( $attr['url'] )
		? \Jetpack_Gutenberg::validate_block_embed_url( $attr['url'], array( 'calendar.google.com' ) ) :
		'';
	$classes = \Jetpack_Gutenberg::block_classes( 'google-calendar', $attr );

	if ( empty( $url ) ) {
		return;
	}

	if ( class_exists( 'Jetpack_AMP_Support' ) && \Jetpack_AMP_Support::is_amp_request() ) {
		return sprintf(
			'<div class="%1$s"><amp-iframe src="%2$s" frameborder="0" style="border:0" scrolling="no" width="%3$d" height="%4$d" sandbox="allow-scripts allow-same-origin" layout="responsive"></amp-iframe></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			absint( $width ),
			absint( $height )
		);
	} else {
		return sprintf(
			'<div class="%1$s"><iframe src="%2$s" frameborder="0" style="border:0" scrolling="no" width="%3$d" height="%4$d"></iframe></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			absint( $width ),
			absint( $height )
		);
	}
}
