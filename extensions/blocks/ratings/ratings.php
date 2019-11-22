<?php

// Load generic function definitions
require_once __DIR__ . '/rating-meta.php';

function jetpack_rating_star_register_block() {
	jetpack_register_block(
		'jetpack/rating-star',
		array(
			'render_callback' => 'jetpack_rating_meta_render_block',
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
					'type' => 'text',
				),
				'ratingStyle' => array(
					'type'    => 'text',
					'default' => 'star',
				),
				'className'   => array(
					'type' => 'text',
				),
				'align'       => array(
					'type'    => 'text',
					'default' => 'left',
				),
			),
		)
	);
}
add_action( 'init', 'jetpack_rating_star_register_block' );

// The following filter is added only to support the old 0.6.2 version of the AMP plugin.
// This entire section can be removed once we're on version a newer version.
// Confirmed that version 1.4.1 (or presumably newer) does not need this filter.
function jetpack_rating_star_amp_add_inline_css() {
	echo '.wp-block-jetpack-rating-star span { display: none; }';
}
add_action( 'amp_post_template_css', 'jetpack_rating_star_amp_add_inline_css', 11 );
