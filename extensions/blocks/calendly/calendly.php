<?php
/**
 * Calendly Block.
 *
 * @since 8.2.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/calendly',
	array( 'render_callback' => 'jetpack_calendly_block_load_assets' )
);

/**
 * Calendly block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Calendly block attributes.
 * @param string $content String containing the Calendly block content.
 *
 * @return string
 */
function jetpack_calendly_block_load_assets( $attr, $content ) {
	$url = jetpack_calendly_block_get_attribute( $attr, 'url' );
	if ( empty( $url ) ) {
		return;
	}

	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( 'calendly' );
	wp_enqueue_script(
		'jetpack-calendly-external-js',
		'https://assets.calendly.com/assets/external/widget.js',
		null,
		JETPACK__VERSION,
		false
	);

	$style                          = jetpack_calendly_block_get_attribute( $attr, 'style' );
	$hide_event_type_details        = jetpack_calendly_block_get_attribute( $attr, 'hideEventTypeDetails' );
	$background_color               = jetpack_calendly_block_get_attribute( $attr, 'backgroundColor' );
	$text_color                     = jetpack_calendly_block_get_attribute( $attr, 'textColor' );
	$primary_color                  = jetpack_calendly_block_get_attribute( $attr, 'primaryColor' );
	$submit_button_text             = jetpack_calendly_block_get_attribute( $attr, 'submitButtonText' );
	$submit_button_text_color       = jetpack_calendly_block_get_attribute( $attr, 'customTextButtonColor' );
	$submit_button_background_color = jetpack_calendly_block_get_attribute( $attr, 'customBackgroundButtonColor' );
	$classes                        = Jetpack_Gutenberg::block_classes( 'calendly', $attr );

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
				'.wp-block-jetpack-calendly .button{%1$s%2$s}',
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
			'<div class="%1$s"><a class="button" href="" onclick="Calendly.initPopupWidget({url:\'%2$s\'});return false;">%3$s</a></div>',
			esc_attr( $classes ),
			esc_url( $url ),
			wp_kses_post( $submit_button_text )
		);
	} else { // Button style.
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
function jetpack_calendly_block_get_attribute( $attributes, $attribute_name ) {
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
