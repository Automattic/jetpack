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
			'uses_context'    => array( 'openLinksNewWindow' ),
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
	$kses_defaults             = wp_kses_allowed_html( 'post' );
	$name                      = wp_kses( $attr['name'], $kses_defaults );
	$name_attr                 = esc_attr( $attr['name'] );
	$id                        = esc_attr( $attr['id'] );
	$url                       = esc_url( $attr['url'] );
	$description               = wp_kses( $attr['description'], $kses_defaults );
	$icon                      = esc_attr( isset( $attr['icon'] ) ? $attr['icon'] : null );
	$target                    = esc_attr( $block->context['openLinksNewWindow'] ? '_blank' : '_self' );
	$email                     = esc_attr( get_current_user_id() ? get_userdata( get_current_user_id() )->user_email : '' );
	$wp_nonce                  = esc_attr( wp_create_nonce( 'blogsub_subscribe_' . $id ) );
	$subscribe_text            = esc_html__( 'Subscribe', 'jetpack' );
	$submit_text               = esc_html__( 'Submit', 'jetpack' );
	$cancel_text               = esc_html__( 'Cancel', 'jetpack' );
	$disabled_subscribe_button = '';
	$subscribe_button_class    = 'is-style-fill';
	$is_following              = ( function_exists( 'wpcom_subs_is_subscribed' ) && wpcom_subs_is_subscribed(
		array(
			'user_id' => get_current_user_id(),
			'blog_id' => $id,
		)
	) ) || isset( $_GET['blogid'] ) && $id === $_GET['blogid']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- View logic.

	if ( $is_following ) {
		$subscribe_text            = esc_html__( 'Subscribed', 'jetpack' );
		$disabled_subscribe_button = 'disabled';
		$subscribe_button_class    = 'is-style-outline';
	}

	if ( empty( $icon ) ) {
		$icon = 'https://s0.wp.com/i/webclip.png';
	}

	$form_buttons      = <<<HTML
		<!-- wp:button {"className":"is-style-fill"} -->
		<div class="wp-block-button jetpack-blogroll-item-submit-button is-style-fill">
			<button type="submit" name="blog_id" value="$id" class="wp-block-button__link wp-element-button">$submit_text</button>
		</div>
		<!-- /wp:button -->

		<!-- wp:button {"className":"is-style-outline"} -->
		<div class="wp-block-button jetpack-blogroll-item-cancel-button is-style-outline">
			<button type="reset" class="wp-block-button__link wp-element-button">$cancel_text</button>
		</div>
HTML;
	$form_buttons_html = do_blocks( $form_buttons );

	$subscribe_button      = <<<HTML
		<!-- wp:button {"className":"$subscribe_button_class"} -->
		<div class="wp-block-button jetpack-blogroll-item-subscribe-button $subscribe_button_class">
			<button type="button" class="wp-block-button__link wp-element-button" {$disabled_subscribe_button}>$subscribe_text</button>
		</div>
		<!-- /wp:button -->
HTML;
	$subscribe_button_html = do_blocks( $subscribe_button );

	/**
	 * Build the block content.
	 */
	$content = <<<HTML
		<div class="jetpack-blogroll-item-information">
			<figure>
				<img src="$icon" alt="$name_attr">
			</figure>
			<div>
				<a class="jetpack-blogroll-item-title" href="$url" target="$target" rel="noopener noreferrer">$name</a>
				<div class="jetpack-blogroll-item-description">$description</div>
			</div>
			$subscribe_button_html
		</div>
		<fieldset disabled class="jetpack-blogroll-item-submit">
			<input type="hidden" name="_wpnonce" value="$wp_nonce">
			<input type="email" name="email" placeholder="Email address" value="$email" class="jetpack-blogroll-item-email-input">
			$form_buttons_html
		</fieldset>
HTML;

	return sprintf(
		'<div class="%1$s">
			<div class="jetpack-blogroll-item-slider">%2$s</div>
		</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
