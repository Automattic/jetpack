<?php
/**
 * Author-recommendation Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\AuthorRecommendation;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'author-recommendation';
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
			'render_callback' => __NAMESPACE__ . '\load_assets',
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
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Author-recommendation block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Author-recommendation block attributes.
 * @param string $content String containing the Author-recommendation block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();

	foreach ( $attr['recommendations'] as $recommendation ) {
		$name      = empty( $recommendation['name'] ) ? '' : esc_html( $recommendation['name'] );
		$url       = empty( $recommendation['URL'] ) ? '' : esc_attr( $recommendation['URL'] );
		$site_icon = empty( $recommendation['site_icon'] ) ? '' : esc_attr( $recommendation['site_icon'] );

		$icon_image = $site_icon ? "<img src={$site_icon} />" : '';

		$content .= "<div class='recommendation-row'>
						<div>{$icon_image}</div>
						<div><a href='{$url}'>{$name}</a></div>
					</div>";
	}

	return sprintf(
		'<div class="%s"%s>%s</div>',
		! empty( $wrapper_attributes['class'] ) ? esc_attr( $wrapper_attributes['class'] ) : '',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		$content
	);
}
