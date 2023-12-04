<?php
/**
 * Like Block.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\Like;

use Automattic\Jetpack\Blocks;
use Jetpack_Gutenberg;

/**
 * Registers the block for use in Gutenberg
 * This is done via an action so that we can disable
 * registration if we need to.
 */
function register_block() {
	Blocks::jetpack_register_block(
		__DIR__,
		array(
			'api_version'     => 3,
			'render_callback' => __NAMESPACE__ . '\render_block',
		)
	);
}
add_action( 'init', __NAMESPACE__ . '\register_block' );

/**
 * Fetches likes data from the WordPress.com REST API.
 *
 * @param int $blog_id The ID of the blog (site).
 * @param int $post_id The ID of the post.
 *
 * @return array|bool|null The likes data retrieved from the API, or false on error.
 */
function fetch_likes_data( $blog_id, $post_id ) {
	$api_url = 'https://public-api.wordpress.com/rest/v1.1/sites/' . $blog_id . '/posts/' . $post_id . '/likes/?force=wpcom';

	$response = wp_remote_get( $api_url );

	if ( is_wp_error( $response ) || wp_remote_retrieve_response_code( $response ) !== 200 ) {
		return false;
	}

	$data = json_decode( wp_remote_retrieve_body( $response ), true );

	return $data;
}

/**
 * Like block render function.
 *
 * @param array  $attr Array containing the Like block attributes.
 * @param string $content String containing the Like block content.
 * @param object $block Object containing the Like block data.
 *
 * @return string
 */
function render_block( $attr, $content, $block ) {
	/*
	 * Enqueue necessary scripts and styles.
	 */
	Jetpack_Gutenberg::load_assets_as_required( __DIR__ );

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		$blog_id = get_current_blog_id();
		$type    = 'wpcom'; // WPCOM simple sites.
	} else {
		$blog_id = \Jetpack_Options::get_option( 'id' );
		$type    = 'jetpack'; // Self-hosted (includes Atomic)
	}

	$post_id = $block->context['postId'];

	$likes_data      = fetch_likes_data( $blog_id, $post_id );
	$like_avatar_url = '';

	if ( ! empty( $likes_data ) && ! empty( $likes_data['likes'] ) ) {
		$like_avatar_url = $likes_data['likes'][0]['avatar_URL'];
	}

	$output = '';
	if ( ! empty( $like_avatar_url ) ) {
		$output = sprintf( '<img src="%s" alt="Liker Avatar">', esc_url( $like_avatar_url ) );
	}

	return sprintf(
		'<div class="%1$s" data-blog-id="%2$d" data-blog-type="%3$s">%4$s</div>',
		esc_attr( Blocks::classes( Blocks::get_block_feature( __DIR__ ), $attr ) ),
		esc_attr( $blog_id ),
		esc_attr( $type ),
		$output
	);
}
