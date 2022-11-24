<?php
/**
 * Colors block support flag.
 *
 * @package WordPress
 * @since 5.6.0
 */

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @since 5.6.0
 * @access private
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function wp_register_colors_support( $block_type ) {
	$color_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$color_support = _wp_array_get( $block_type->supports, array( 'color' ), false );
	}
	$has_text_colors_support       = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'text' ), true ) );
	$has_background_colors_support = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'background' ), true ) );
	$has_gradients_support         = _wp_array_get( $color_support, array( 'gradients' ), false );
	$has_link_colors_support       = _wp_array_get( $color_support, array( 'link' ), false );
	$has_color_support             = $has_text_colors_support ||
		$has_background_colors_support ||
		$has_gradients_support ||
		$has_link_colors_support;

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_color_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_background_colors_support && ! array_key_exists( 'backgroundColor', $block_type->attributes ) ) {
		$block_type->attributes['backgroundColor'] = array(
			'type' => 'string',
		);
	}

	if ( $has_text_colors_support && ! array_key_exists( 'textColor', $block_type->attributes ) ) {
		$block_type->attributes['textColor'] = array(
			'type' => 'string',
		);
	}

	if ( $has_gradients_support && ! array_key_exists( 'gradient', $block_type->attributes ) ) {
		$block_type->attributes['gradient'] = array(
			'type' => 'string',
		);
	}
}


/**
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @since 5.6.0
 * @access private
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Colors CSS classes and inline styles.
 */
function wp_apply_colors_support( $block_type, $block_attributes ) {
	$color_support = _wp_array_get( $block_type->supports, array( 'color' ), false );

	if (
		is_array( $color_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $color_support ) &&
		$color_support['__experimentalSkipSerialization']
	) {
		return array();
	}

	$has_text_colors_support       = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'text' ), true ) );
	$has_background_colors_support = true === $color_support || ( is_array( $color_support ) && _wp_array_get( $color_support, array( 'background' ), true ) );
	$has_gradients_support         = _wp_array_get( $color_support, array( 'gradients' ), false );
	$classes                       = array();
	$styles                        = array();

	// Text colors.
	// Check support for text colors.
	if ( $has_text_colors_support ) {
		$has_named_text_color  = array_key_exists( 'textColor', $block_attributes );
		$has_custom_text_color = isset( $block_attributes['style']['color']['text'] );

		// Apply required generic class.
		if ( $has_custom_text_color || $has_named_text_color ) {
			$classes[] = 'has-text-color';
		}
		// Apply color class or inline style.
		if ( $has_named_text_color ) {
			$classes[] = sprintf( 'has-%s-color', _wp_to_kebab_case( $block_attributes['textColor'] ) );
		} elseif ( $has_custom_text_color ) {
			$styles[] = sprintf( 'color: %s;', $block_attributes['style']['color']['text'] );
		}
	}

	// Background colors.
	if ( $has_background_colors_support ) {
		$has_named_background_color  = array_key_exists( 'backgroundColor', $block_attributes );
		$has_custom_background_color = isset( $block_attributes['style']['color']['background'] );

		// Apply required background class.
		if ( $has_custom_background_color || $has_named_background_color ) {
			$classes[] = 'has-background';
		}
		// Apply background color classes or styles.
		if ( $has_named_background_color ) {
			$classes[] = sprintf( 'has-%s-background-color', _wp_to_kebab_case( $block_attributes['backgroundColor'] ) );
		} elseif ( $has_custom_background_color ) {
			$styles[] = sprintf( 'background-color: %s;', $block_attributes['style']['color']['background'] );
		}
	}

	// Gradients.
	if ( $has_gradients_support ) {
		$has_named_gradient  = array_key_exists( 'gradient', $block_attributes );
		$has_custom_gradient = isset( $block_attributes['style']['color']['gradient'] );

		if ( $has_named_gradient || $has_custom_gradient ) {
			$classes[] = 'has-background';
		}
		// Apply required background class.
		if ( $has_named_gradient ) {
			$classes[] = sprintf( 'has-%s-gradient-background', _wp_to_kebab_case( $block_attributes['gradient'] ) );
		} elseif ( $has_custom_gradient ) {
			$styles[] = sprintf( 'background: %s;', $block_attributes['style']['color']['gradient'] );
		}
	}

	$attributes = array();
	if ( ! empty( $classes ) ) {
		$attributes['class'] = implode( ' ', $classes );
	}
	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( ' ', $styles );
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'colors',
	array(
		'register_attribute' => 'wp_register_colors_support',
		'apply'              => 'wp_apply_colors_support',
	)
);
