<?php
/**
 * Premium Content Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

require_once __DIR__ . '/_inc/access-check.php';
require_once __DIR__ . '/logged-out-view/logged-out-view.php';
require_once __DIR__ . '/subscriber-view/subscriber-view.php';
require_once __DIR__ . '/buttons/buttons.php';
require_once __DIR__ . '/login-button/login-button.php';

const FEATURE_NAME = 'premium-content/container';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	// Only load this block on WordPress.com.
	if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || jetpack_is_atomic_site() ) {
		// Determine required `context` key based on Gutenberg version.
		$deprecated = function_exists( 'gutenberg_get_post_from_context' );
		$provides   = $deprecated ? 'providesContext' : 'provides_context';

		Blocks::jetpack_register_block(
			FEATURE_NAME,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
				'plan_check'      => true,
				'attributes'      => array(
					'isPremiumContentChild' => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
				$provides         => array(
					'premium-content/planId' => 'selectedPlanId',
					'isPremiumContentChild'  => 'isPremiumContentChild',
				),
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
	if ( ! pre_render_checks() ) {
		return '';
	}

	Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );
	return $content;
}
