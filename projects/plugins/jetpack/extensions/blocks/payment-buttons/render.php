<?php
/**
 * Payment Buttons block render implementation.
 *
 * Loaded lazily from payment-buttons.php only when the block is rendered, to
 * keep the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\PaymentButtons;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Render implementation.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block_implementation( $attributes, $content ) {
	\Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $content;
}

/**
 * Render email implementation.
 *
 * @param string $block_content The block content.
 * @param array  $parsed_block  The parsed block data.
 * @param object $rendering_context The email rendering context.
 *
 * @return string
 */
function render_block_email_implementation( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer' ) ) {
		return '';
	}

	/*
	 * Ignore font size set on the buttons block.
	 * We rely on TypographyPreprocessor to set the font size on the buttons.
	 * Rendering font size on the wrapper causes unwanted whitespace below the buttons.
	 */
	if ( isset( $parsed_block['attrs']['style']['typography']['fontSize'] ) ) {
		unset( $parsed_block['attrs']['style']['typography']['fontSize'] );
	}

	// We are checking for the class existence above, so we know it exists.
	$flex_layout_renderer = new \Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer();

	if ( ! method_exists( $flex_layout_renderer, 'render_inner_blocks_in_layout' ) ) {
		return '';
	}

	// We are checking for the method existence above, so we know it exists.
	return $flex_layout_renderer->render_inner_blocks_in_layout( $parsed_block, $rendering_context );
}
