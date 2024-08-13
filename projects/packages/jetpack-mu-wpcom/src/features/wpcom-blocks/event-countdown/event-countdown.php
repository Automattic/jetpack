<?php
/**
 * Event Countdown Block
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\EventCountdown;

require_once __DIR__ . '/../../../utils.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	register_block_type(
		'jetpack/event-countdown',
		array(
			'render_callback' => __NAMESPACE__ . '\load_assets',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Load assets on frontend.
 *
 * @param array  $attr    Array containing the EventCountdown block attributes.
 * @param string $content String containing the EventCountdown block content.
 *
 * @return string
 */
function load_assets( $attr, $content ) {
	// A block's view assets will not be required in wp-admin.
	if ( ! is_admin() ) {
		\jetpack_mu_wpcom_enqueue_assets( 'wpcom-blocks-event-countdown-view', array( 'js', 'css' ) );
	}

	return $content;
}

/**
 * Load assets on the editor.
 */
function enqueue_block_editor_assets() {
	\jetpack_mu_wpcom_enqueue_assets( 'wpcom-blocks-event-countdown-editor', array( 'js', 'css' ) );
}
if ( is_admin() ) {
	add_action( 'enqueue_block_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );
} else {
	add_action( 'enqueue_block_editor_assets', __NAMESPACE__ . '\enqueue_block_editor_assets' );
}
