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
				'blogroll_title' => array(
					'type' => 'string',
				),
				'align'          => array(
					'type' => 'string',
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
	$blogroll_title = $attributes['blogroll_title'];
	$bookmars       = get_bookmarks(
		array(
			'orderby'       => 'name',
			'order'         => 'ASC',
			'category_name' => '',
			'limit'         => -1,
		)
	);

	$bookmars = array_map(
		function ( $bookmark ) {
			return sprintf(
				'<li><a href="%1$s">%2$s</a></li>',
				$bookmark->link_url,
				$bookmark->link_name
			);
		},
		$bookmars
	);

	return sprintf(
		'<ul>%s</ul>',
		implode( $bookmars )
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
		'<div">%1$s</div>',
		$content
	);
}

// Aid users in enabling the links menu without having to install other plugins or search how to.
add_filter( 'pre_option_link_manager_enabled', '__return_true' );
