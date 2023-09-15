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
	$kses_defaults = wp_kses_allowed_html( 'post' );

	$name           = wp_kses( $attr['name'], $kses_defaults );
	$name_attr      = esc_attr( $attr['name'] );
	$id             = esc_attr( $attr['id'] );
	$url            = esc_url( $attr['url'] );
	$description    = wp_kses( $attr['description'], $kses_defaults );
	$icon           = esc_attr( $attr['icon'] );
	$target         = esc_attr( $block->context['openLinksNewWindow'] ? '_blank' : '_self' );
	$subscribe_text = esc_html__( 'Subscribe', 'jetpack' );
	$submit_text    = esc_html__( 'Submit', 'jetpack' );
	$cancel_text    = esc_html__( 'Cancel', 'jetpack' );
	$email          = esc_attr( get_current_user_id() ? get_userdata( get_current_user_id() )->user_email : '' );
	$wp_nonce       = esc_attr( wp_create_nonce( 'blogsub_subscribe_' . $id ) );

	if ( empty( $icon ) ) {
		$icon = 'https://s0.wp.com/i/webclip.png';
	}

	$subscribe_button = '';
	if ( $block->context['showSubscribeButton'] ) {
		$subscribe_button = <<<HTML
		<button type="button" class="jetpack-blogroll-item-subscribe-button wp-block-button__link">
			$subscribe_text
		</button>
HTML;
	}

	$content = <<<HTML
		<div class="jetpack-blogroll-item-information">
			<figure>
				<img src="$icon" alt="$name_attr">
			</figure>
			<div>
				<a class="jetpack-blogroll-item-title" href="$url" target="$target" rel="noopener noreferrer">$name</a>
				<div class="jetpack-blogroll-item-description">$description</div>
			</div>
			$subscribe_button
		</div>
	HTML;

	$buttons = <<<HTML
		<!-- wp:buttons -->
		<div class="wp-block-buttons"><!-- wp:button {"className":"is-style-fill"} -->
		<div class="wp-block-button is-style-fill"><button type="submit" name="blog_id" value="$id" class="wp-block-button__link wp-element-button">$submit_text</button></div>
		<!-- /wp:button -->

		<!-- wp:button {"className":"is-style-outline"} -->
		<div class="wp-block-button is-style-outline"><button type="reset" class="wp-block-button__link wp-element-button jetpack-blogroll-item-cancel-button">$cancel_text</button></div>
		<!-- /wp:button --></div>
		<!-- /wp:buttons -->
HTML;

	$buttons_html = do_blocks( $buttons );

	if ( $block->context['showSubscribeButton'] ) {
		$content .= <<<HTML
		<fieldset disabled class="jetpack-blogroll-item-submit">
			<input type="hidden" name="_wpnonce" value="$wp_nonce">
			<input type="email" placeholder="Email address" value="$email" class="jetpack-blogroll-item-email-input">
			$buttons_html
		</fieldset>
HTML;
	}

	return sprintf(
		'<div class="%1$s">
			<div class="jetpack-blogroll-item-slider">%2$s</div>
		</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
