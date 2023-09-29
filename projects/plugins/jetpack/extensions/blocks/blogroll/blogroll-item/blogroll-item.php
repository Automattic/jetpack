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
		$icon = "data:image/svg+xml,%3Csvg width='48' height='48' viewBox='0 0 48 48' fill='none' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Crect width='48' height='48' fill='%23E5E5E5'/%3E%3Cg id='edge cases'%3E%3Cpath d='M-5746 -1273C-5746 -1274.1 -5745.1 -1275 -5744 -1275H2020C2021.1 -1275 2022 -1274.1 2022 -1273V635C2022 636.105 2021.1 637 2020 637H-5744C-5745.1 637 -5746 636.105 -5746 635V-1273Z' fill='%233C434A'/%3E%3Cg id='d_v1_overflow' clip-path='url(%23clip0_37_971)'%3E%3Crect width='1595' height='1068' transform='translate(-234 -815)' fill='white'/%3E%3Cg id='Main'%3E%3Cg id='Canvas'%3E%3Crect x='-234.5' y='-755.5' width='1316' height='985' fill='%23F6F7F7'/%3E%3Cg id='add-site-suggestions'%3E%3Cg clip-path='url(%23clip1_37_971)'%3E%3Crect x='-22' y='-111' width='350' height='298' fill='white'/%3E%3Cg id='Block Group'%3E%3Cg id='blogroll-add-link'%3E%3Crect width='314' height='58' transform='translate(-4 -9)' fill='white'/%3E%3Cg id='avatar+info'%3E%3Cg id='avatar'%3E%3Ccircle id='bg' cx='24' cy='24' r='24' fill='url(%23pattern0)'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3Crect x='-22.5' y='-111.5' width='351' height='299' stroke='%23DDDDDD'/%3E%3C/g%3E%3Crect x='-234.5' y='-755.5' width='1316' height='985' stroke='%23CCCCCC'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3Cpath d='M-5744 -1274H2020V-1276H-5744V-1274ZM2021 -1273V635H2023V-1273H2021ZM2020 636H-5744V638H2020V636ZM-5745 635V-1273H-5747V635H-5745ZM-5744 636C-5744.55 636 -5745 635.552 -5745 635H-5747C-5747 636.657 -5745.66 638 -5744 638V636ZM2021 635C2021 635.552 2020.55 636 2020 636V638C2021.66 638 2023 636.657 2023 635H2021ZM2020 -1274C2020.55 -1274 2021 -1273.55 2021 -1273H2023C2023 -1274.66 2021.66 -1276 2020 -1276V-1274ZM-5744 -1276C-5745.66 -1276 -5747 -1274.66 -5747 -1273H-5745C-5745 -1273.55 -5744.55 -1274 -5744 -1274V-1276Z' fill='black' fill-opacity='0.1'/%3E%3C/g%3E%3Cdefs%3E%3Cpattern id='pattern0' patternContentUnits='objectBoundingBox' width='1' height='1'%3E%3Cuse xlink:href='%23image0_37_971' transform='scale(0.0125)'/%3E%3C/pattern%3E%3CclipPath id='clip0_37_971'%3E%3Crect width='1595' height='1068' fill='white' transform='translate(-234 -815)'/%3E%3C/clipPath%3E%3CclipPath id='clip1_37_971'%3E%3Crect x='-22' y='-111' width='350' height='298' fill='white'/%3E%3C/clipPath%3E%3Cimage id='image0_37_971' data-name='no-site-icon.png' width='80' height='80' xlink:href='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAYAAACOEfKtAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAATUSURBVHgB7ZzvbxJpEMenBwEKJ1ybthaFi+f1ohd9cblLLtF/X6OJJr6y0cYfbWwV1AYFBQtpo893Gxr26S67MDNLY+aTNAJdof0wz/PMzPPQpXv3H34nY25+IYOFCWRiApmYQCYmkIkJZGICmZhAJiaQiQlkYgKZmEAmJpCJCWRiApmYQCYmkIkJZGICmeTpglCtVqlSXqZazf1bKVMul6N8/vTHOz4+ptFoREdHQ+r3B9TtfaFer0cXgYUKzOdzVK9vUn3z8pms6OvywVe5XKbV1RVquseGw2Egcn//wN0e0aJYiECIazauBvLmpVgs0sY6vtbow8fDhYnMXGC9fjmQNy3iZgUSa9VLTuLbQGaWZCrwj2u/x0Yd5rnOp8/U6/boq5vnMOfhMTAevqViIRjCVSfLfwMQkVtb16ns5s+9vTeUFUtZbKxjyN688VewUMTx6PGTM2FpuHvn/9jv9QcD2t5+5p7vhLTJJI25devvqfIAhrYUFRetN9wblgXqAjFs8QslgXmx2bxKUtTcG3bNvbY2qnMgJvdZVtpAYiMs8cHDR+evSyn6inttrMytVpu0UIvAopvwG4IRNQbyfMmT+PPo6YqfIy3UBDYbDbdqFkmaafKQxjzdfh6SCHmNhvwbOUZFIKJvY2ONsgTy9g/e0sCtwK3W+9D3MJS1olBFIKJPAkhJex3knd13t49cqTdJfXP+qmcaKgKrtUvExZcy63Wtd+GFg1M2TkNcIPI97tw3Td5kVE677uPh4bm5MCkXnQfxNAY1KYekyPOHahyoQjqdz6G5GG0y6TaYuMBKpULzknrYxlyTlOIguZbOCcWHcKlUoHlIKy+OJHmgUlkmacQjsFBIJzCqwpiXNPJALidfeIlHoGSfLw1p5QGNXFC9mZA2l5uXpmKVkQZxgX4t2mq31SWmRaM/KD7e8ENODuOCywmxOCQtEHEN0uD/Cr0BQ686kUA8AgeDb6H7v6boBU5Dsk+osekkLrDb7YbuV2v87D+pA5OWfr9P0ogL7HsRuLqyotqPm2WIYx9ZGvE5EKUSFpLxPAh56+vr7ArAnyMn88ioOXbrz+uhMg7zn8ZpBpU05nw/Tm7DKC1+R0gj+oCOwHY42rBnm9ROkkx1sOj4HSGtVEpFIFIZf8hiIUCnOg6pdAWv4S86OK2gkcIAtUoEQvx+3G23PywhMe4aPDf2oCeBOM1EXk0gonD/4F3oMQxlrsS4rs1YXtTQ1Yo+oFoLYxj7QzmtxMjHY+SVy8uR8vDa2oeN1JsJu3tv3AoYTh8g8b9//5mpwoiTh+e4HSEP52N2MzhklEnvaWfnRRAh/hEPTPY4vZB0LM2XF+SWa2tUv7IZuf+CfO/5zkvKgqUs/+xJ0vG2nsvVOp1Pbkty5KLqZvA45CEtQlMCdTVKw9WV32L7jhi2uz/b8bZJEHGNiDyNC94ALFqa52CiyPyEKoYqqoJg+AqdXoA0yJvlfKEUS4v8y0VYTCASZdesEQlZKBlb7fcLETdmoaf0kZ+9fPU6uI1Nb+wpY++2VCoGm1OTH3M4OTk5/YhDtxd0fOxjDh4QclGkzIJ9UomJCWRiApmYQCYmkIkJZGICmZhAJiaQiQlkYgKZmEAmJpCJCWRiApmYQCYmkIkJZGICmfwAzeIV04TFHZIAAAAASUVORK5CYII='/%3E%3C/defs%3E%3C/svg%3E%0A";
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
