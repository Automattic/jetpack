<?php
/**
 * Related Posts block render implementation.
 *
 * Loaded lazily from related-posts.php only when the block is rendered, to keep
 * the render body out of the eager front-end PHP/opcache footprint.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\RelatedPosts;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use WP_Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Related Posts block render callback.
 *
 * @param array    $attributes Array containing the Button block attributes.
 * @param string   $content    The block content.
 * @param WP_Block $block    The block object.
 *
 * @return string
 */
function render_block_implementation( $attributes, $content, $block ) {
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
