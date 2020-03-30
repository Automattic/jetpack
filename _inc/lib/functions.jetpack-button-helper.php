<?php
/**
 * Helper for the shared Button component for CTA blocks.
 *
 * @package jetpack
 */

if ( ! function_exists( 'jetpack_get_button_classes' ) ) {
	/**
	 * Get the shared Button component classes.
	 *
	 * @param array $attributes Array containing the block attributes.
	 *
	 * @return string
	 */
	function jetpack_get_button_classes( $attributes ) {
		$classes                     = array( 'wp-block-button__link' );
		$has_class_name              = array_key_exists( 'className', $attributes );
		$has_named_text_color        = array_key_exists( 'buttonTextColor', $attributes );
		$has_custom_text_color       = array_key_exists( 'customButtonTextColor', $attributes );
		$has_named_background_color  = array_key_exists( 'buttonBackgroundColor', $attributes );
		$has_custom_background_color = array_key_exists( 'customButtonBackgroundColor', $attributes );
		$has_named_gradient          = array_key_exists( 'buttonGradient', $attributes );
		$has_custom_gradient         = array_key_exists( 'customButtonGradient', $attributes );
		$has_border_radius           = array_key_exists( 'buttonBorderRadius', $attributes );

		if ( $has_class_name ) {
			$classes[] = $attributes['className'];
		}

		if ( $has_named_text_color || $has_custom_text_color ) {
			$classes[] = 'has-text-color';
		}
		if ( $has_named_text_color ) {
			$classes[] = sprintf( 'has-%s-color', $attributes['buttonTextColor'] );
		}

		if (
			$has_named_background_color ||
			$has_custom_background_color ||
			$has_named_gradient ||
			$has_custom_gradient
		) {
			$classes[] = 'has-background';
		}
		if ( $has_named_background_color && ! $has_custom_gradient ) {
			$classes[] = sprintf( 'has-%s-background-color', $attributes['buttonBackgroundColor'] );
		}
		if ( $has_named_gradient ) {
			$classes[] = sprintf( 'has-%s-gradient-background', $attributes['buttonGradient'] );
		}

		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( $has_border_radius && 0 == $attributes['buttonBorderRadius'] ) {
			$classes[] = 'no-border-radius';
		}

		return implode( ' ', $classes );
	}
}

if ( ! function_exists( 'jetpack_get_button_styles' ) ) {
	/**
	 * Get the shared Button component styles.
	 *
	 * @param array $attributes Array containing the block attributes.
	 *
	 * @return string
	 */
	function jetpack_get_button_styles( $attributes ) {
		$styles                      = array();
		$has_named_text_color        = array_key_exists( 'buttonTextColor', $attributes );
		$has_custom_text_color       = array_key_exists( 'customButtonTextColor', $attributes );
		$has_named_background_color  = array_key_exists( 'buttonBackgroundColor', $attributes );
		$has_custom_background_color = array_key_exists( 'customButtonBackgroundColor', $attributes );
		$has_named_gradient          = array_key_exists( 'buttonGradient', $attributes );
		$has_custom_gradient         = array_key_exists( 'customButtonGradient', $attributes );
		$has_border_radius           = array_key_exists( 'buttonBorderRadius', $attributes );

		if ( ! $has_named_text_color && $has_custom_text_color ) {
			$styles[] = sprintf( 'color: %s;', $attributes['customButtonTextColor'] );
		}

		if ( ! $has_named_background_color && ! $has_named_gradient && $has_custom_gradient ) {
			$styles[] = sprintf( 'background: %s;', $attributes['customButtonGradient'] );
		}

		if (
			$has_custom_background_color &&
			! $has_named_background_color &&
			! $has_named_gradient &&
			! $has_custom_gradient
		) {
			$styles[] = sprintf( 'background-color: %s;', $attributes['customButtonBackgroundColor'] );
		}

		// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
		if ( $has_border_radius && 0 != $attributes['buttonBorderRadius'] ) {
			$styles[] = sprintf( 'border-radius: %spx;', $attributes['buttonBorderRadius'] );
		}

		return implode( ' ', $styles );
	}
}

if ( ! function_exists( 'jetpack_resolve_button_deprecations' ) ) {
	/**
	 * Convert expected deprecated attributes into their corresponding valid ones.
	 *
	 * @param array $attributes Array containing the block attributes.
	 *
	 * @return array
	 */
	function jetpack_resolve_button_deprecations( $attributes ) {
		$deprecation_map = array(
			'submitButtonText'                  => 'buttonText',
			'text'                              => 'buttonText',
			'submitButtonBackgroundColor'       => 'buttonBackgroundColor',
			'backgroundButtonColor'             => 'buttonBackgroundColor',
			'backgroundColor'                   => 'buttonBackgroundColor',
			'customSubmitButtonBackgroundColor' => 'customButtonBackgroundColor',
			'customBackgroundButtonColor'       => 'customButtonBackgroundColor',
			'customBackgroundColor'             => 'customButtonBackgroundColor',
			'submitButtonTextColor'             => 'buttonTextColor',
			'textButtonColor'                   => 'buttonTextColor',
			'textColor'                         => 'buttonTextColor',
			'customSubmitButtonTextColor'       => 'customButtonTextColor',
			'customTextButtonColor'             => 'customButtonTextColor',
			'customTextColor'                   => 'customButtonTextColor',
			'gradient'                          => 'buttonGradient',
			'customGradient'                    => 'customButtonGradient',
			'borderRadius'                      => 'buttonBorderRadius',
		);

		foreach ( $deprecation_map as $deprecated => $valid ) {
			if ( isset( $attributes[ $deprecated ] ) && empty( $attributes[ $valid ] ) ) {
				$attributes[ $valid ] = $attributes[ $deprecated ];
				unset( $attributes[ $deprecated ] );
			}
		}

		return $attributes;
	}
}
