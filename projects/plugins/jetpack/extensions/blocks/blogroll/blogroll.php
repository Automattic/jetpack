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
			'supports'        => array(
				'color'      => array(
					'gradients' => true,
					'link'      => true,
				),
				'spacing'    => array(
					'margin'  => true,
					'padding' => true,
				),
				'typography' => array(
					'fontSize'   => true,
					'lineHeight' => true,
				),
			),
			'attributes'      => array(
				'title'           => array(
					'type'    => 'string',
					'default' => 'Title',
				),
				'title_markup'    => array(
					'type'    => 'string',
					'default' => 'h2',
				),
				'hide_invisible'  => array(
					'type'    => 'boolean',
					'default' => true,
				),
				'limit'           => array(
					'type'    => 'number',
					'default' => -1,
				),
				'orderby'         => array(
					'type'    => 'string',
					'default' => 'name',
				),
				'order'           => array(
					'type'    => 'string',
					'default' => 'DESC',
				),
				'list_style'      => array(
					'type'    => 'string',
					'default' => 'none',
				),
				'textColor'       => array(
					'type' => 'string',
				),
				'backgroundColor' => array(
					'type' => 'string',
				),
				'fontSize'        => array(
					'type' => 'string',
				),
				'style'           => array(
					'type' => 'object',
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
	$title_markup = in_array( $attributes['title_markup'], array( 'h1', 'h2', 'h3', 'h4', 'h5', 'p' ), true )
		? $attributes['title_markup']
		: 'h2';

	$args = array(
		'title_li'        => $attributes['title'],
		'title_before'    => "<$title_markup>",
		'title_after'     => "</$title_markup>",
		'hide_invisible'  => $attributes['hide_invisible'],
		'categorize'      => 0,
		'orderby'         => $attributes['orderby'],
		'order'           => $attributes['order'],
		'limit'           => $attributes['limit'],
		'echo'            => false,
		'category_before' => '',
		'category_after'  => '',
	);

	$bookmark_markup = wp_list_bookmarks(
		$args
	);

	if ( empty( $bookmark_markup ) ) {
		return sprintf(
			'<p>%s<a href="/wp-admin/link-manager.php" target="_blank">%s</a></p>',
			esc_html__( 'No bookmarks found.', 'jetpack' ),
			esc_html__( 'Add a bookmark', 'jetpack' )
		);
	}

	return $bookmark_markup;
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

	$content            = get_bookmark_content( $attributes );
	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

	return sprintf(
		'<div class="%1$s%2$s"%3$s>%4$s</div>',
		! empty( $wrapper_attributes['class'] ) ? ' ' . esc_attr( $wrapper_attributes['class'] ) : '',
		! empty( $attributes['list_style'] ) ? ' ' . esc_attr( 'list-style-' . $attributes['list_style'] ) : '',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		$content
	);
}
