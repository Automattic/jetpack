<?php
/**
 * Google Calendar Block.
 *
 * @since 8.3.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Google_Calendar;

use Automattic\Jetpack\Blocks;
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
	$classes = Blocks::classes( FEATURE_NAME, $attr );

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	if ( empty( $url ) ) {
		return '';
	}

	$placeholder = sprintf(
		'<a href="%s" %s>%s</a>',
		esc_url( $url ),
		Blocks::is_amp_request() ? 'placeholder' : '',
		esc_html__( 'Google Calendar', 'jetpack' )
	);

	$iframe = sprintf(
		'<iframe src="%1$s" frameborder="0" style="border:0" scrolling="no" height="%2$d" width="100%%">%3$s</iframe>',
		esc_url( $url ),
		absint( $height ),
		$placeholder
	);

	return sprintf( '<div class="%s">%s</div>', esc_attr( $classes ), $iframe );
}
