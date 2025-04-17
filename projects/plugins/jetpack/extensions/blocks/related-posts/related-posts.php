<?php
/**
 * Related Posts Block.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\RelatedPosts;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use WP_Block;

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
	if ( ! ( new Modules() )->is_active( 'related-posts' ) && ! current_user_can( 'jetpack_activate_modules' ) ) {
		return;
	}

	if (
		( new Host() )->is_wpcom_simple()
		|| ( \Jetpack::is_connection_ready() && ! ( new Status() )->is_offline_mode() )
	) {
		Blocks::jetpack_register_block(
			__DIR__,
			array(
				'render_callback' => __NAMESPACE__ . '\render_block',
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block', 9 );

/**
 * Related Posts block render callback.
 *
 * @param array    $attributes Array containing the Button block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block    The block object.
 *
 * @return string
 */
function render_block( $attributes, $content, $block ) {
	// If the Related Posts module is not active, don't render the block.
	if (
		! ( new Host() )->is_wpcom_simple()
		&& ! ( new Modules() )->is_active( 'related-posts' )
	) {
		return '';
	}

	// If the Related Posts option is turned off, don't render the block.
	$options = \Jetpack_Options::get_option( 'relatedposts', array() );
	if ( empty( $options['enabled'] ) || ! $options['enabled'] ) {
		return '';
	}

	if ( ! class_exists( 'Jetpack_RelatedPosts' ) ) {
		require_once JETPACK__PLUGIN_DIR . 'modules/related-posts/jetpack-related-posts.php';
	}

	return \Jetpack_RelatedPosts::init()->render_block( $attributes, $content, $block );
}
