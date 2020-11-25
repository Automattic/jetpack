<?php
/**
 * Premium Content Logged Out View Child Block.
 *
 * @package Jetpack
 */

namespace Automattic\Jetpack\Extensions\Premium_Content;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'premium-content/logged-out-view';
const BLOCK_NAME   = 'jetpack/' . FEATURE_NAME;

require_once '../_inc/access-check.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array(
            'render_callback' => __NAMESPACE__ . '\render_block',
            $uses             => array( 'premium-content/planId' ),
        )
	);
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
function render_block( $attributes, $content, $block = null ) {
	if ( ! pre_render_checks() ) {
		return '';
	}

	$visitor_has_access = current_visitor_can_access( $attributes, $block );
	if ( $visitor_has_access ) {
		// The viewer has access to premium content, so the viewer shouldn't see the logged out view.
		return '';
	}

	Jetpack_Gutenberg::load_styles_as_required( FEATURE_NAME );

	// Old versions of the block were rendering the subscribe/login button server-side, so we need to still support them.
	if ( ! empty( $attributes['buttonClasses'] ) ) {
		require_once '../_inc/legacy-buttons.php';

		$buttons = create_legacy_buttons_markup( $attributes, $block );
		return $content . $buttons;
	}

	return $content;
}
