<?php
/**
 * Overrides the paragraph block placeholder for sites with write intent.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue block editor assets.
 */
function wpcom_enqueue_paragraph_block_placeholder_assets() {
	global $post;

	if ( ! is_post_with_write_intent( $post ) ) {
		return;
	}

	$asset_file          = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/paragraph-block-placeholder/paragraph-block-placeholder.asset.php';
	$script_dependencies = $asset_file['dependencies'] ?? array();
	$version             = $asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/paragraph-block-placeholder/paragraph-block-placeholder.js' );

	wp_enqueue_script(
		'paragraph-block-placeholder-script',
		plugins_url( 'build/paragraph-block-placeholder/paragraph-block-placeholder.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$version,
		true
	);

	wp_localize_script(
		'paragraph-block-placeholder-script',
		'wpcomParagraphBlock',
		array( 'placeholder' => __( "Start writing or type '/' to insert a block", 'jetpack-mu-wpcom' ) )
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_paragraph_block_placeholder_assets' );

/**
 * Check is it a post with “write” intent
 *
 * @param WP_Post|null $post Current post object. It would be null if the current post is not retrieved.
 */
function is_post_with_write_intent( $post ) {
	return isset( $post ) && 'post' === $post->post_type && 'write' === get_option( 'site_intent', '' );
}

/**
 * Replace the title placeholder if it's the post with “write” intent
 *
 * @param string       $text Text to shown.
 * @param WP_Post|null $post Current post object. It would be null if the current post is not retrieved.
 */
function wpcom_enter_title_here( $text, $post ) {
	if ( is_post_with_write_intent( $post ) ) {
		return __( 'Add a post title', 'jetpack-mu-wpcom' );
	}

	return $text;
}
add_filter( 'enter_title_here', 'wpcom_enter_title_here', 0, 2 );

/**
 * Replace the body placeholder if it's the post with “write” intent
 *
 * @param string       $text Text to shown.
 * @param WP_Post|null $post Current post object. It would be null if the current post is not retrieved.
 */
function wpcom_write_your_story( $text, $post ) {
	if ( is_post_with_write_intent( $post ) ) {
		return __( "Start writing or type '/' to insert a block", 'jetpack-mu-wpcom' );
	}

	return $text;
}
add_filter( 'write_your_story', 'wpcom_write_your_story', 0, 2 );
