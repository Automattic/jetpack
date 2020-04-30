<?php
/**
 * Star Rating Block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Rating_Star;

use Jetpack_Gutenberg;

const FEATURE_NAME = 'rating-star';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

// Load generic function definitions.
require_once __DIR__ . '/rating-meta.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	jetpack_register_block(
		BLOCK_NAME,
		array(
			'render_callback' => __NAMESPACE__ . '\render_block',
			'attributes'      => array(
				'rating'      => array(
					'type'    => 'number',
					'default' => 1,
				),
				'maxRating'   => array(
					'type'    => 'number',
					'default' => 5,
				),
				'color'       => array(
					'type' => 'string',
				),
				'ratingStyle' => array(
					'type'    => 'string',
					'default' => 'star',
				),
				'className'   => array(
					'type' => 'string',
				),
				'align'       => array(
					'type'    => 'string',
					'default' => 'left',
				),
			),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Dynamic rendering of the block.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return string
 */
function render_block( $attributes ) {
	// Tell Jetpack to load the assets registered via jetpack_register_block.
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	return jetpack_rating_meta_render_block( $attributes );
}

/**
 * The following filter is added only to support the old 0.6.2 version of the AMP plugin.
 * This entire section can be removed once we're on version a newer version.
 * Confirmed that version 1.4.1 (or presumably newer) does not need this filter.
 */
function amp_add_inline_css() {
	echo '.wp-block-jetpack-rating-star span { display: none; }';
}
add_action( 'amp_post_template_css', __NAMESPACE__ . '\amp_add_inline_css', 11 );

