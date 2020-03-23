<?php
/**
 * Google Calendar Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Google_Calendar;

use Jetpack_AMP_Support;
use Jetpack_Gutenberg;

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
			'render_callback' => __NAMESPACE__ . '\load_assets',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Google Calendar block registration/dependency declaration.
 *
 * @param array $attr Array containing the Google Calendar block attributes.
 * @return string
 */
function load_assets( $attr ) {
	$height  = isset( $attr['height'] ) ? $attr['height'] : '600';
	$url     = isset( $attr['url'] )
		? Jetpack_Gutenberg::validate_block_embed_url( $attr['url'], array( 'calendar.google.com' ) ) :
		'';
	$classes = Jetpack_Gutenberg::block_classes( FEATURE_NAME, $attr );

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	if ( empty( $url ) ) {
		return;
	}

	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return sprintf(
			'<div class="%1$s"><amp-iframe src="%2$s" frameborder="0" style="border:0" scrolling="no" height="%3$d" sandbox="allow-scripts allow-same-origin" layout="responsive"></amp-iframe></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			absint( $height )
		);
	} else {
		return sprintf(
			'<div class="%1$s"><iframe src="%2$s" frameborder="0" style="border:0" scrolling="no" height="%3$d"></iframe></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			absint( $height )
		);
	}
}
