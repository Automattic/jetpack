<?php
/**
 * Blogroll Block.
 *
 * @since 12.1
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll;

require_once __DIR__ . '/blogroll-item/blogroll-item.php';

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
 * Blogroll block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Blogroll block attributes.
 * @param string $content String containing the Blogroll block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$wrapper_attributes = \WP_Block_Supports::get_instance()->apply_block_supports();
	$placeholder_icon   = '<svg xmlns="http://www.w3.org/2000/svg" height="38px" viewBox="0 0 24 24" width="38px" fill="#646970"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18l2-2 1-1v-2h-2v-1l-1-1H9v3l2 2v1.931C7.06 19.436 4 16.072 4 12l1 1h2v-2h2l3-3V6h-2L9 5v-.411a7.945 7.945 0 016 0V6l-1 1v2l1 1 3.13-3.13A7.983 7.983 0 0119.736 10H18l-2 2v2l1 1h2l.286.286C18.029 18.061 15.239 20 12 20z"/></svg>';

	if ( $attr['recommendations'] ) {
		foreach ( $attr['recommendations'] as $recommendation ) {
			$url       = empty( $recommendation['URL'] ) ? '' : esc_url( $recommendation['URL'] );
			$site_icon = empty( $recommendation['site_icon'] ) ? '' : esc_url( $recommendation['site_icon'] );
			$name      = empty( $recommendation['name'] ) ? '' : $recommendation['name'];

			$icon_image = $site_icon ? "<img class='site-icon' src='{$site_icon}' alt='" . esc_attr( $name ) . "' />" : $placeholder_icon;

			if ( empty( $name ) || empty( $url ) ) {
				continue;
			}

			$content .= "<div class='recommendation-row'>
							{$icon_image}
							<a href='{$url}'>" . esc_html( $name ) . '</a>
						</div>';
		}
	}

	return sprintf(
		'<div class="%s"%s>%s</div>',
		! empty( $wrapper_attributes['class'] ) ? esc_attr( $wrapper_attributes['class'] ) : '',
		! empty( $wrapper_attributes['style'] ) ? ' style="' . esc_attr( $wrapper_attributes['style'] ) . '"' : '',
		$content
	);
}
