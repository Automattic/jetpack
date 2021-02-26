<?php
/**
 * Button Block.
 *
 * @since 8.5.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Button;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'button';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Button block render callback.
 *
 * @param array  $attributes Array containing the Button block attributes.
 * @param string $content    The Button block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	$save_in_post_content = get_attribute( $attributes, 'saveInPostContent' );

	if ( Blocks::is_amp_request() ) {
		Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
	}

	if ( $save_in_post_content || ! class_exists( 'DOMDocument' ) ) {
		return $content;
	}

	$element   = get_attribute( $attributes, 'element' );
	$text      = get_attribute( $attributes, 'text' );
	$unique_id = get_attribute( $attributes, 'uniqueId' );
	$url       = get_attribute( $attributes, 'url' );
	$classes   = Blocks::classes( FEATURE_NAME, $attributes, array( 'wp-block-button' ) );

	$button_classes = get_button_classes( $attributes );
	$button_styles  = get_button_styles( $attributes );

	$button_attributes = sprintf( ' class="%s" style="%s"', esc_attr( $button_classes ), esc_attr( $button_styles ) );

	if ( empty( $unique_id ) ) {
		$button_attributes .= ' data-id-attr="placeholder"';
	} else {
		$button_attributes .= sprintf( ' data-id-attr="%1$s" id="%1$s"', esc_attr( $unique_id ) );
	}

	if ( 'a' === $element ) {
		$button_attributes .= sprintf( ' href="%s" target="_blank" role="button" rel="noopener noreferrer"', esc_url( $url ) );
	} elseif ( 'button' === $element ) {
		$button_attributes .= ' type="submit"';
	} elseif ( 'input' === $element ) {
		$button_attributes .= sprintf( ' type="submit" value="%s"', wp_strip_all_tags( $text, true ) );
	}

	$button = 'input' === $element
		? '<' . $element . $button_attributes . ' />'
		: '<' . $element . $button_attributes . '>' . $text . '</' . $element . '>';

	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	return '<div class="' . esc_attr( $classes ) . '">' . $button . '</div>';
}

/**
 * Get the Button block classes.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return string
 */
function get_button_classes( $attributes ) {
	$classes                     = array( 'wp-block-button__link' );
	$has_class_name              = array_key_exists( 'className', $attributes );
	$has_named_text_color        = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color       = array_key_exists( 'customTextColor', $attributes );
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );
	$has_named_gradient          = array_key_exists( 'gradient', $attributes );
	$has_custom_gradient         = array_key_exists( 'customGradient', $attributes );
	$has_border_radius           = array_key_exists( 'borderRadius', $attributes );

	if ( $has_class_name ) {
		$classes[] = $attributes['className'];
	}

	if ( $has_named_text_color || $has_custom_text_color ) {
		$classes[] = 'has-text-color';
	}
	if ( $has_named_text_color ) {
		$classes[] = sprintf( 'has-%s-color', $attributes['textColor'] );
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
		$classes[] = sprintf( 'has-%s-background-color', $attributes['backgroundColor'] );
	}
	if ( $has_named_gradient ) {
		$classes[] = sprintf( 'has-%s-gradient-background', $attributes['gradient'] );
	}

	// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
	if ( $has_border_radius && 0 == $attributes['borderRadius'] ) {
		$classes[] = 'no-border-radius';
	}

	return implode( ' ', $classes );
}

/**
 * Get the Button block styles.
 *
 * @param array $attributes Array containing the block attributes.
 *
 * @return string
 */
function get_button_styles( $attributes ) {
	$styles                      = array();
	$has_named_text_color        = array_key_exists( 'textColor', $attributes );
	$has_custom_text_color       = array_key_exists( 'customTextColor', $attributes );
	$has_named_background_color  = array_key_exists( 'backgroundColor', $attributes );
	$has_custom_background_color = array_key_exists( 'customBackgroundColor', $attributes );
	$has_named_gradient          = array_key_exists( 'gradient', $attributes );
	$has_custom_gradient         = array_key_exists( 'customGradient', $attributes );
	$has_border_radius           = array_key_exists( 'borderRadius', $attributes );

	if ( ! $has_named_text_color && $has_custom_text_color ) {
		$styles[] = sprintf( 'color: %s;', $attributes['customTextColor'] );
	}

	if ( ! $has_named_background_color && ! $has_named_gradient && $has_custom_gradient ) {
		$styles[] = sprintf( 'background: %s;', $attributes['customGradient'] );
	}

	if (
		$has_custom_background_color &&
		! $has_named_background_color &&
		! $has_named_gradient &&
		! $has_custom_gradient
	) {
		$styles[] = sprintf( 'background-color: %s;', $attributes['customBackgroundColor'] );
	}

	// phpcs:ignore WordPress.PHP.StrictComparisons.LooseComparison
	if ( $has_border_radius && 0 != $attributes['borderRadius'] ) {
		$styles[] = sprintf( 'border-radius: %spx;', $attributes['borderRadius'] );
	}

	return implode( ' ', $styles );
}

/**
 * Get filtered attributes.
 *
 * @param array  $attributes     Array containing the Button block attributes.
 * @param string $attribute_name String containing the attribute name to get.
 *
 * @return string
 */
function get_attribute( $attributes, $attribute_name ) {
	if ( isset( $attributes[ $attribute_name ] ) ) {
		return $attributes[ $attribute_name ];
	}

	$default_attributes = array(
		'url'               => '#',
		'element'           => 'a',
		'saveInPostContent' => false,
	);

	if ( isset( $default_attributes[ $attribute_name ] ) ) {
		return $default_attributes[ $attribute_name ];
	}
}
