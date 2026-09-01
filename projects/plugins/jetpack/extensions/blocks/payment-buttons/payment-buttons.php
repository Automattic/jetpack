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
				'plan_check'            => true,
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
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attributes Array containing the block attributes.
 * @param string $content    String containing the block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	require_once __DIR__ . '/render.php';
	return render_block_implementation( $attributes, $content );
}

/**
 * Render email callback.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param string $block_content The block content.
 * @param array  $parsed_block  The parsed block data.
 * @param object $rendering_context The email rendering context.
 *
 * @return string
 */
function render_block_email( $block_content, array $parsed_block, $rendering_context ) {
	require_once __DIR__ . '/render.php';
	return render_block_email_implementation( $block_content, $parsed_block, $rendering_context );
}
