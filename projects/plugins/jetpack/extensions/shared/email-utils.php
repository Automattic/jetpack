<?php
/**
 * Shared email rendering utilities for Jetpack blocks.
 *
 * @package automattic/jetpack
 * @since $$next-version$$
 */

namespace Automattic\Jetpack\Extensions\Shared;

/**
 * Wrap HTML with horizontal padding from email_attrs.
 *
 * The email preprocessor distributes root horizontal padding to blocks via
 * email_attrs (padding-left, padding-right). This helper wraps rendered HTML
 * in a div that applies those values, since tables and some renderers don't
 * handle padding from email_attrs natively.
 *
 * @since $$next-version$$
 *
 * @param string $html        The rendered HTML to wrap.
 * @param array  $email_attrs The email_attrs from the parsed block.
 * @return string The HTML, optionally wrapped with horizontal padding.
 */
function apply_email_horizontal_padding( $html, $email_attrs ) {
	if ( empty( $email_attrs ) || ! class_exists( '\WP_Style_Engine' ) ) {
		return $html;
	}

	$padding_style = \WP_Style_Engine::compile_css(
		array_intersect_key( $email_attrs, array_flip( array( 'padding-left', 'padding-right' ) ) ),
		''
	) ?? '';

	if ( ! empty( $padding_style ) ) {
		$html = '<div style="' . esc_attr( $padding_style ) . '">' . $html . '</div>';
	}

	return $html;
}
