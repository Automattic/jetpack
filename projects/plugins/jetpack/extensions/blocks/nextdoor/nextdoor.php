<?php
/**
 * Nextdoor Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Nextdoor;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'nextdoor';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Nextdoor block registration/dependency declaration.
 *
 * @param array $attr    Array containing the Nextdoor block attributes.
 * @return string
 */
function load_assets( $attr ) {
	$pattern = '/^http[s]?:\/\/((?:www\.)?nextdoor(?:.*)?\/(?:embed)\/[a-z0-9\/\?=_\-\.\,&%$#\@\!\+]*)/i';

	$url = isset( $attr['url'] ) ? $attr['url'] : null;

	if ( empty( $url ) ) {
		return;
	}

	if ( ! preg_match( $pattern, $url ) ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$iframe_markup = '<iframe src="' . esc_url( $url ) . '" frameborder="0" title="' . esc_html__( 'Nextdoor embed', 'jetpack' ) . '" height="200" width="100%"></iframe>';

	$block_classes = Blocks::classes( FEATURE_NAME, $attr );

	$html =
		'<figure class="' . esc_attr( $block_classes ) . '">' .
			$iframe_markup .
		'</figure>';

	return $html;
}
