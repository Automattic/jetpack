<?php
/**
 * Sharing Buttons Block.
 *
 * @since 11.x
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Sharing_Button;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

require_once JETPACK__PLUGIN_DIR . 'modules/sharedaddy/sharing-sources.php';

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array( 'render_callback' => __NAMESPACE__ . '\render_block' )
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Sharing Buttons block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the Sharing Buttons block attributes.
 * @param string $content String containing the Sharing Buttons block content.
 * @param array  $block Array containing block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	$post_id = $block->context['postId'];

	$style_type  = $block->context['styleType'];
	$style       = 'style-' . $style_type;
	$data_shared = 'sharing-' . $attr['service'] . '-' . $post_id . $attr['service'];
	$link_url    = get_permalink( $post_id ) . '?share=' . $attr['service'] . '&nb=1';

	$content = str_replace( 'url_replaced_in_runtime', $link_url, $content );
	$content = str_replace( 'style_button_replace_at_runtime', $style, $content );
	$content = str_replace( 'data-shared_replaced_in_runtime', $data_shared, $content );
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );
	return $content;
}
