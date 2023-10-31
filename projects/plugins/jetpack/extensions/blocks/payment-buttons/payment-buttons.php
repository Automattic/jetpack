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

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) && ! \Jetpack::is_connection_ready() ) {
		return;
	}

	require_once JETPACK__PLUGIN_DIR . '/modules/memberships/class-jetpack-memberships.php';
	if ( \Jetpack_Memberships::is_enabled_jetpack_recurring_payments() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
				'supports'        => array(
					'__experimentalLayout' => array(
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
			Blocks::get_block_name( __DIR__ ),
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
	\Jetpack_Gutenberg::load_styles_as_required( __DIR__ );

	return $content;
}
