<?php
/**
 * Calendly Block.
 *
 * @since 8.2.0
 *
 * @package Jetpack
 */

namespace Jetpack\Calendly_Block;

const FEATURE_NAME = 'calendly';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Check if the block should be available on the site.
 *
 * @return bool
 */
function is_available() {
	if (
		defined( 'IS_WPCOM' )
		&& IS_WPCOM
		&& function_exists( 'has_any_blog_stickers' )
	) {
		if ( has_any_blog_stickers(
			array( 'premium-plan', 'business-plan', 'ecommerce-plan' ),
			get_current_blog_id()
		) ) {
			return true;
		}
		return false;
	}

	return true;
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( is_available() ) {
		jetpack_register_block(
			BLOCK_NAME,
			array( 'render_callback' => 'Jetpack\Calendly_Block\load_assets' )
		);
	}
}
add_action( 'init', 'Jetpack\Calendly_Block\register_block' );

/**
 * Set the availability of the block as the editor
 * is loaded
 */
function set_availability() {
	if ( is_available() ) {
		\Jetpack_Gutenberg::set_extension_available( BLOCK_NAME );
	} else {
		\Jetpack_Gutenberg::set_extension_unavailable(
			BLOCK_NAME,
			'missing_plan',
			array(
				'required_feature' => 'calendly',
				'required_plan'    => 'value_bundle',
			)
		);
	}
}
add_action( 'init', 'Jetpack\Calendly_Block\set_availability' );

/**
 * Calendly block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Calendly block attributes.
 * @param string $content String containing the Calendly block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	$url = \Jetpack_Gutenberg::validate_block_embed_url(
		get_attribute( $attr, 'url' ),
		array( 'calendly.com' )
	);
	if ( empty( $url ) ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	\Jetpack_Gutenberg::load_assets_as_required( 'calendly' );
	wp_enqueue_script(
		'jetpack-calendly-external-js',
		'https://assets.calendly.com/assets/external/widget.js',
		null,
		JETPACK__VERSION,
		false
	);

	$style                          = get_attribute( $attr, 'style' );
	$hide_event_type_details        = get_attribute( $attr, 'hideEventTypeDetails' );
	$background_color               = get_attribute( $attr, 'backgroundColor' );
	$text_color                     = get_attribute( $attr, 'textColor' );
	$primary_color                  = get_attribute( $attr, 'primaryColor' );
	$submit_button_text             = get_attribute( $attr, 'submitButtonText' );
	$submit_button_classes          = get_attribute( $attr, 'submitButtonClasses' );
	$submit_button_text_color       = get_attribute( $attr, 'customTextButtonColor' );
	$submit_button_background_color = get_attribute( $attr, 'customBackgroundButtonColor' );
	$classes                        = \Jetpack_Gutenberg::block_classes( 'calendly', $attr );
	$block_id                       = wp_unique_id( 'calendly-block-' );

	$url = add_query_arg(
		array(
			'hide_event_type_details' => (int) $hide_event_type_details,
			'background_color'        => sanitize_hex_color_no_hash( $background_color ),
			'text_color'              => sanitize_hex_color_no_hash( $text_color ),
			'primary_color'           => sanitize_hex_color_no_hash( $primary_color ),
		),
		$url
	);

	if ( 'link' === $style ) {
		wp_enqueue_style( 'jetpack-calendly-external-css', 'https://assets.calendly.com/assets/external/widget.css', null, JETPACK__VERSION );

		/*
		 * If we have some additional styles from the editor
		 * (a custom text color, custom bg color, or both )
		 * Let's add that CSS inline.
		 */
		if ( ! empty( $submit_button_text_color ) || ! empty( $submit_button_background_color ) ) {
			$inline_styles = sprintf(
				'#%1$s .wp-block-button__link{%2$s%3$s}',
				esc_attr( $block_id ),
				! empty( $submit_button_text_color )
					? 'color:#' . sanitize_hex_color_no_hash( $submit_button_text_color ) . ';'
					: '',
				! empty( $submit_button_background_color )
					? 'background-color:#' . sanitize_hex_color_no_hash( $submit_button_background_color ) . ';'
					: ''
			);
			wp_add_inline_style( 'jetpack-calendly-external-css', $inline_styles );
		}

		$content = sprintf(
			'<div class="wp-block-button %1$s" id="%2$s"><a class="%3$s" role="button" onclick="Calendly.initPopupWidget({url:\'%4$s\'});return false;">%5$s</a></div>',
			esc_attr( $classes ),
			esc_attr( $block_id ),
			! empty( $submit_button_classes ) ? esc_attr( $submit_button_classes ) : 'wp-block-button__link',
			esc_js( $url ),
			wp_kses_post( $submit_button_text )
		);
	} else { // Inline style.
		$content = sprintf(
			'<div class="calendly-inline-widget %1$s" data-url="%2$s" style="min-width:320px;height:630px;"></div>',
			esc_attr( $classes ),
			esc_url( $url )
		);
	}

	return $content;
}

/**
 * Get filtered attributes.
 *
 * @param array  $attributes     Array containing the Calendly block attributes.
 * @param string $attribute_name String containing the attribute name to get.
 *
 * @return string
 */
function get_attribute( $attributes, $attribute_name ) {
	if ( isset( $attributes[ $attribute_name ] ) ) {
		return $attributes[ $attribute_name ];
	}

	$default_attributes = array(
		'style'                => 'inline',
		'submitButtonText'     => esc_html__( 'Schedule time with me', 'jetpack' ),
		'backgroundColor'      => 'ffffff',
		'textColor'            => '4D5055',
		'primaryColor'         => '00A2FF',
		'hideEventTypeDetails' => false,
	);

	if ( isset( $default_attributes[ $attribute_name ] ) ) {
		return $default_attributes[ $attribute_name ];
	}
}
