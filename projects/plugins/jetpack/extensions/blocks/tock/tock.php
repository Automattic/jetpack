<?php
/**
 * Tock Block.
 *
 * @since 12.3
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Tock;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

const FEATURE_NAME = 'tock';
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
 * Render the widget and associated JS
 *
 * @param array $attr    The block attributes.
 */
function render_block( $attr ) {
	$content = '<div id="Tock_widget_container" data-tock-display-mode="Button" data-tock-color-mode="Blue" data-tock-locale="en-us" data-tock-timezone="America/New_York"></div>';
	if ( empty( $attr['url'] ) ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}

		$content .= Jetpack_Gutenberg::notice(
			__( 'The block will not be shown to your site visitors until a Tock business name is set.', 'jetpack' ),
			'warning',
			Blocks::classes( FEATURE_NAME, $attr )
		);
	}

	wp_enqueue_script( 'tock-widget', 'https://www.exploretock.com/tock.js', array(), JETPACK__VERSION, true );

	// Add CSS to hide direct link.
	Jetpack_Gutenberg::load_assets_as_required( FEATURE_NAME );

	wp_add_inline_script(
		'tock-widget',
		"!function(t,o){if(!t.tock){var e=t.tock=function(){e.callMethod?
		  e.callMethod.apply(e,arguments):e.queue.push(arguments)};t._tock||(t._tock=e),
		  e.push=e,e.loaded=!0,e.version='1.0',e.queue=[];}}(window,document);
			tock('init', '" . esc_js( $attr['url'] ) . "');",
		'before'
	);
	return sprintf(
		'<div class="%1$s">%2$s</div>',
		esc_attr( Blocks::classes( FEATURE_NAME, $attr ) ),
		$content
	);
}
