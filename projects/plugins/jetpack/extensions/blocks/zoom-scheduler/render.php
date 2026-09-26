<?php
/**
 * Zoom Scheduler block render implementation.
 *
 * Loaded lazily from zoom-scheduler.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Zoom_Scheduler;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Keep in sync with the IFRAME_HEIGHT in edit.js and min-block-size in view.scss.
const IFRAME_HEIGHT       = 900;
const EMBED_WRAPPER_CLASS = 'wp-block-jetpack-zoom-scheduler__embed';

/**
 * Dynamic rendering of the block.
 *
 * @param array $attr Array containing the Zoom Scheduler block attributes.
 * @return string
 */
function render( $attr ) {
	$url = isset( $attr['url'] )
		? Jetpack_Gutenberg::validate_block_embed_url( $attr['url'], array( 'scheduler.zoom.us' ) )
		: '';

	if ( empty( $url ) ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$url       = set_url_scheme( $url, 'https' );
	$classes   = Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr );
	$embed_url = add_query_arg( 'embed', 'true', $url );

	if ( Blocks::is_amp_request() ) {
		return sprintf(
			'<div class="%1$s"><a href="%2$s" target="_blank" rel="noopener noreferrer">%3$s</a></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			esc_html__( 'Open Zoom Scheduler', 'jetpack' )
		);
	}

	/*
	 * The embed is cross-origin to the WordPress page (host is allow-listed
	 * above), so the framed Zoom page cannot reach the parent DOM regardless of
	 * these tokens. allow-same-origin lets the booking page use its own cookies
	 * and storage, allow-scripts runs its booking UI, and allow-popups/allow-forms
	 * cover the confirmation flow.
	 */
	$sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';

	return sprintf(
		'<div class="%1$s"><div class="%2$s"><iframe src="%3$s" title="%4$s" width="100%%" height="%5$d" frameborder="0" loading="lazy" sandbox="%6$s"></iframe></div></div>',
		esc_attr( $classes ),
		esc_attr( EMBED_WRAPPER_CLASS ),
		esc_url( $embed_url ),
		esc_attr__( 'Zoom Scheduler', 'jetpack' ),
		IFRAME_HEIGHT,
		esc_attr( $sandbox )
	);
}
