<?php
/**
 * Adds fallback behavior for non-Gutenframed sites to be able to use the 'Share Post' functionality from WPCOM Reader.
 *
 * @package share-post
 */

/**
 * Saves shared post data.
 *
 * @param int     $target_post_id Post ID.
 * @param WP_Post $post           Post object.
 * @param bool    $update         Whether this is an update.
 *
 * @return int|void|WP_Error
 */
function wpcomsh_insert_shared_post_data( $target_post_id, $post, $update ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
	// This `$update` check avoids infinite loops of trying to update our updated post.
	if ( $update ) {
		return;
	}

	// Abort this function if we are not in a post sharing context.
	$is_post_share = isset( $_GET['is_post_share'] ) && $_GET['is_post_share']; // phpcs:ignore WordPress.Security
	if ( ! $is_post_share ) {
		return;
	}

	// phpcs:disable WordPress.Security
	$title   = $_GET['title'];
	$image   = $_GET['image'];
	$text    = $_GET['text'];
	$url     = $_GET['url'];
	$embed   = strtok( $_GET['embed'], '?' );
	$link    = sprintf(
		'<a href="%1$s">%2$s</a>',
		esc_url( $url ),
		sanitize_text_field( $title )
	);
	$content = '';
	// phpcs:enable

	if ( $embed ) {
		$content .= wpcomsh_get_embed_content( $embed );
	}

	if ( $image ) {
		$content .= wpcomsh_get_image_content( $image, $text, $link );
	}

	if ( $text ) {
		$content .= wpcomsh_get_text_content( $text, $link );
	}

	$data = array(
		'ID'           => $target_post_id,
		'post_title'   => $title,
		'post_content' => $content,
	);

	// Required to satisfy get_default_post_to_edit(), which has these filters after post creation.
	add_filter( 'default_title', 'wpcomsh_filter_title', 10, 2 );
	add_filter( 'default_content', 'wpcomsh_filter_content', 10, 2 );

	return wp_update_post( $data );
}
add_action( 'wp_insert_post', 'wpcomsh_insert_shared_post_data', 10, 3 );

/**
 * Generate the embed content for our sharing post.
 *
 * @param string $embed URL of our embed.
 * @return string Generated content for the sharing post.
 */
function wpcomsh_get_embed_content( $embed ) {
	return sprintf(
		'<!-- wp:embed {"url":"%s"} --><figure><div class="wp-block-embed__wrapper">%s</div></figure><!-- /wp:embed -->',
		esc_url( $embed )
	);
}

/**
 * Generate the image content for our sharing post.
 *
 * @param string $image URL of our image.
 * @param string $text  Content of the shared post.
 * @param string $link  Permalink to the shared post.
 * @return string Generated content for the sharing post.
 */
function wpcomsh_get_image_content( $image, $text, $link ) {
	return sprintf(
		'<!-- wp:image --><figure class="wp-block-image"><img src="%1$s" alt=""/>%2$s</figure><!-- /wp:image -->',
		esc_url( $image ),
		empty( $text ) ? '<figcaption>' . $link . '</figcaption>' : null // $link is escaped on initialization
	);
}

/**
 * Generate the text content for our sharing post.
 *
 * @param string $text Content of the shared post.
 * @param string $link Permalink to the shared post.
 * @return string Generated content for the sharing post.
 */
function wpcomsh_get_text_content( $text, $link ) {
	return sprintf(
		'<!-- wp:quote --><blockquote class="wp-block-quote"><p>%1$s</p><cite>%2$s</cite></blockquote><!-- /wp:quote -->',
		wp_kses_post( $text ),
		$link // Escaped on initialization.
	);
}

/**
 * Update the target post's title.
 *
 * @param string  $post_title Post title determined by `get_default_post_to_edit()`.
 * @param WP_Post $post       Post object of newly-inserted post.
 * @return string Updated post title from source post.
 */
function wpcomsh_filter_title( $post_title, $post ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
	return $post->post_title;
}

/**
 * Update the target post's content (`post_content`).
 *
 * @param string  $post_content Post content determined by `get_default_post_to_edit()`.
 * @param WP_Post $post         Post object of newly-inserted post.
 * @return string Updated post content from source post.
 */
function wpcomsh_filter_content( $post_content, $post ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
	return $post->post_content;
}
