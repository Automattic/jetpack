<?php
/**
 * Instagram Gallery Block.
 *
 * @since 8.5.0
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Instagram_Gallery;

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\External_Connections;
use Jetpack;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	if ( ( defined( 'IS_WPCOM' ) && IS_WPCOM ) || Jetpack::is_connection_ready() ) {
		Blocks::jetpack_register_block(
			__DIR__,
			array( 'render_callback' => __NAMESPACE__ . '\render_block' )
		);

		External_Connections::add_settings_for_service(
			'writing',
			array(
				'service'      => 'instagram-basic-display',
				'title'        => __( 'Instagram', 'jetpack' ),
				'description'  => __( 'Display your more recent images from Instagram.', 'jetpack' ),
				'support_link' => array(
					'wpcom'   => 'https://wordpress.com/support/latest-instagram-posts/',
					'jetpack' => 'latest-instagram-posts-block',
				),
			)
		);
	}
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Instagram Gallery block render callback.
 *
 * The render implementation lives in render.php and is only loaded when the
 * block is actually rendered, keeping it out of the eager front-end path.
 *
 * @param array  $attributes Array containing the Instagram Gallery block attributes.
 * @param string $content The Instagram Gallery block content.
 *
 * @return string
 */
function render_block( $attributes, $content ) {
	require_once __DIR__ . '/render.php';
	return render_block_implementation( $attributes, $content );
}
