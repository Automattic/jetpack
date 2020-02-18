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
 * Enqueues the Calendly JS library, and adds an inline
 * function to attach event handlers to the button
 */
function enqueue_calendly_js() {
	wp_enqueue_script(
		'jetpack-calendly-external-js',
		'https://assets.calendly.com/assets/external/widget.js',
		null,
		JETPACK__VERSION,
		false
	);
	wp_add_inline_script(
		'jetpack-calendly-external-js',
		"function calendly_attach_link_events( elementId ) {
			var widget = document.getElementById( elementId );
			if ( widget ) {
				widget.addEventListener( 'click', function( event ) {
					event.preventDefault();
					Calendly.initPopupWidget({url:event.target.href});
				} );

				widget.addEventListener( 'keydown', function( event ) {
					// Enter and space keys.
					if ( event.keyCode === 13 || event.keyCode === 32 ) {
						event.preventDefault();
						event.target && event.target.click();
					}
				} );
			}
		}"
	);
}
/**
 * Calendly block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Calendly block attributes.
 * @param string $content String containing the Calendly block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	if ( is_admin() ) {
		return;
	}
	$url = \Jetpack_Gutenberg::validate_block_embed_url(
		get_attribute( $attr, 'url' ),
		array( 'calendly.com' )
	);
	if ( empty( $url ) ) {
		return;
	}

	$style                   = get_attribute( $attr, 'style' );
	$hide_event_type_details = get_attribute( $attr, 'hideEventTypeDetails' );
	$background_color        = get_attribute( $attr, 'backgroundColor' );
	$text_color              = get_attribute( $attr, 'textColor' );
	$primary_color           = get_attribute( $attr, 'primaryColor' );
	$classes                 = \Jetpack_Gutenberg::block_classes( 'calendly', $attr );
	$is_amp_request          = class_exists( 'Jetpack_AMP_Support' ) && \Jetpack_AMP_Support::is_amp_request();
	$block_id                = wp_unique_id( 'calendly-block-' );

	/*
	 * Enqueue necessary scripts and styles.
	 */
	\Jetpack_Gutenberg::load_assets_as_required( 'calendly' );
	if ( ! wp_script_is( 'jetpack-calendly-external-js' ) && ! $is_amp_request ) {
		enqueue_calendly_js();
	}

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
		if ( ! wp_style_is( 'jetpack-calendly-external-css' ) ) {
			wp_enqueue_style( 'jetpack-calendly-external-css', 'https://assets.calendly.com/assets/external/widget.css', null, JETPACK__VERSION );
		}

		$content = preg_replace( '/data-id-attr="placeholder"/', 'id="' . esc_attr( $block_id ) . '"', $content );

		if ( ! $is_amp_request ) {
			wp_add_inline_script( 'jetpack-calendly-external-js', sprintf( "calendly_attach_link_events( '%s' )", esc_js( $block_id ) ) );
		}
	} else { // Inline style.
		$content = sprintf(
			'<div class="%1$s" id="%2$s"></div>',
			esc_attr( $classes ),
			esc_attr( $block_id )
		);
		$script  = <<<JS_END
Calendly.initInlineWidget({
	url: '%s',
	parentElement: document.getElementById('%s'),
	inlineStyles: false,
});
JS_END;
		wp_add_inline_script( 'jetpack-calendly-external-js', sprintf( $script, esc_url( $url ), esc_js( $block_id ) ) );
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
