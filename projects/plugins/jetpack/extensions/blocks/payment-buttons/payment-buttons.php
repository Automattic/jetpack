<?php
/**
 * Payment Buttons Block.
 *
 * @since 11.3
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\PaymentButtons;

use Automattic\Jetpack\Blocks;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
	if ( \Jetpack_Memberships::should_enable_monetize_blocks_in_editor() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback'       => __NAMESPACE__ . '\render_block',
				'render_email_callback' => __NAMESPACE__ . '\render_block_email',
				'supports'              => array(
					'layout' => array(
						'allowSwitching'  => false,
						'allowInheriting' => false,
						'default'         => array(
							'type' => 'flex',
						),
					),
				),
			)
		);
	} else {
		$required_plan = ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ? 'personal-bundle' : 'jetpack_personal';
		\Jetpack_Gutenberg::set_extension_unavailable(
			'payment-buttons',
			'missing_plan',
			array(
				'required_feature' => 'memberships',
				'required_plan'    => $required_plan,
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Render callback.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	\Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	return $content;
}

/**
 * Render email callback.
 *
 * @param string $block_content The block content.
 * @param array  $parsed_block  The parsed block data.
 * @param object $rendering_context The email rendering context.
 *
 * @return string
 */
function render_block_email( $block_content, array $parsed_block, $rendering_context ) {
	if ( ! class_exists( '\Automattic\WooCommerce\EmailEditor\Engine\Renderer\ContentRenderer\Layout\Flex_Layout_Renderer' ) ) {
		return '';
	}

	// Ignore font size set on the buttons block.
	// We rely on TypographyPreprocessor to set the font size on the buttons.
	// Rendering font size on the wrapper causes unwanted whitespace below the buttons.
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
