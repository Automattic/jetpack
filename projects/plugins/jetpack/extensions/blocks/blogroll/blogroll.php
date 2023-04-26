<?php
/**
 * Blogroll Block.
 *
 * @since 12.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'blogroll';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
			'attributes'      => array(
				'title'          => array(
					'type'    => 'string',
					'default' => 'Title',
				),
				'hide_invisible' => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'limit'          => array(
					'type'    => 'number',
					'default' => -1,
				),
				'orderby'        => array(
					'type'    => 'string',
					'default' => 'name',
				),
				'order'          => array(
					'type'    => 'string',
					'default' => 'DESC',
				),
			),
			'render_callback' => __NAMESPACE__ . '\render',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Return markup bookmark content.
 *
 * @param array $attributes Array containing the Blogroll block attributes.
 *
 * @return string block markup.
 */
function get_bookmark_content( $attributes ) {

	return wp_list_bookmarks(
		array(
			'title_li'        => $attributes['title'],
			'hide_invisible'  => $attributes['hide_invisible'],
			'categorize'      => 0,
			'orderby'         => $attributes['orderby'],
			'order'           => $attributes['order'],
			'limit'           => $attributes['limit'],
			'echo'            => false,
			'category_before' => '',
			'category_after'  => '',
		)
	);
}

/**
 * Blogroll block registration/dependency declaration.
 *
 * @param array  $attributes    Array containing the Blogroll block attributes.
 * @param string $content String containing the Blogroll block content.
 *
 * @return string
 */
function render( $attributes, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );
	$content = get_bookmark_content( $attributes );

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attributes ) ),
		$content
	);
}

// Aid users in enabling the links menu without having to install other plugins or search how to.
add_filter( 'pre_option_link_manager_enabled', '__return_true' );
