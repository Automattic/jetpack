<?php
/**
 * Nextdoor Block.
 *
 * @since 12.8
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Nextdoor;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
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
	if ( ! isset( $attr['url'] ) ) {
		return;
	}

	$url = Jetpack_Gutenberg::validate_block_embed_url(
		$attr['url'],
		array( '/^http[s]?:\/\/((?:www\.)?nextdoor(?:.*)?\/(?:embed)\/\S*)/i' ),
		true
	);

	if ( empty( $url ) ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	$iframe_markup = '<iframe src="' . esc_url( $url ) . '" frameborder="0" title="' . esc_html__( 'Nextdoor embed', 'jetpack' ) . '" height="200" width="100%"></iframe>';

	$block_classes = Blocks::classes( __DIR__, $attr );

	$html =
		'<figure class="' . esc_attr( $block_classes ) . '">' .
			$iframe_markup .
		'</figure>';

	return $html;
}
