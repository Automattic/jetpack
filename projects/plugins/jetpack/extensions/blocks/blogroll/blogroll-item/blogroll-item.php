<?php
/**
 * Blogroll Item Block.
 *
 * @since 12.6
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Blogroll_Item;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'blogroll-item';
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
			'uses_context'    => array( 'showSubscribeButton', 'openLinksNewWindow' ),
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Blogroll Item block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Blogroll Item block attributes.
 * @param string $content    String containing the block content.
 * @param object $block    The block.
 *
 * @return string
 */
function load_assets( $attr, $content, $block ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	$name           = esc_attr( $attr['name'] );
	$id             = esc_attr( $attr['id'] );
	$url            = esc_url( $attr['url'] );
	$description    = esc_attr( $attr['description'] );
	$icon           = esc_attr( $attr['icon'] );
	$target         = $block->context['openLinksNewWindow'] ? '_blank' : '_self';
	$subscribe_text = __( 'Subscribe', 'jetpack' );
	$wp_nonce_field = wp_nonce_field( 'blogsub_subscribe_' . $id, '_wpnonce', false, false );

	if ( empty( $icon ) ) {
		$icon = 'https://s0.wp.com/i/webclip.png';
	}

	$content = <<<HTML
		<figure>
			<img src="$icon" alt="$name">
		</figure>
		<div>
			<a class="jetpack-blogroll-item-title" href="$url" target="$target" rel="noopener noreferrer">$name</a>
			<div class="jetpack-blogroll-item-description">$description</div>
		</div>
	HTML;

	if ( $block->context['showSubscribeButton'] ) {
		$content .= <<<HTML
		<div class="jetpack-blogroll-item-subscribe">
			<button class="jetpack-blogroll-item-subscribe-button wp-block-button__link" id="jetpack-blogroll-item-subscribe-button">
				$subscribe_text
			</button>
			<div class="jetpack-blogroll-item-subscribe-form">
				<button name="blog_id" type="submit" value="$id">$subscribe_text</button>
				$wp_nonce_field
			</div>
		</div>
HTML;
	}

	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
