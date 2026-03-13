<?php
/**
 * VideoPress Block.
 *
 * @since 11.1.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\VideoPress;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Modules;
use Jetpack_Gutenberg;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

const FEATURE_NAME   = 'videopress-block';
const FEATURE_FOLDER = 'videopress';
const BLOCK_NAME     = 'jetpack/' . FEATURE_NAME;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	/*
	 * The block is available even when the module is not active,
	 * so we can display a nudge to activate the module instead of the block.
	 * However, since non-admins cannot activate modules, we do not display the empty block for them.
	 */
	if ( ! ( new Modules() )->is_active( 'videopress' ) && ! current_user_can( 'jetpack_activate_modules' ) ) {
		return;
	}

	Blocks::jetpack_register_block(
		BLOCK_NAME,
		array( 'render_callback' => __NAMESPACE__ . '\load_assets' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * VideoPress block registration/dependency declaration.
 *
 * @param array  $attrs   Array containing the VideoPress block attributes.
 * @param string $content String containing the VideoPress block content.
 *
 * @return string
 */
function load_assets( $attrs, $content ) {
	// Do not render the block if the module is not active.
	if ( ! ( new Modules() )->is_active( 'videopress' ) ) {
		return '';
	}

	Jetpack_Gutenberg::load_assets_as_required( FEATURE_FOLDER );
	return $content;
}
