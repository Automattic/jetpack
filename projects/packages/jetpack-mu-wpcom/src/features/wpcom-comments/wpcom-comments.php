<?php
/**
 * Adds a "Like" action to comment rows and handles the required scripts in the admin area.
 *
 * @package automattic/jetpack-mu-wpcom
 */

function wpcom_comments_add_like_class( $classes, $css_class, $comment_id ) {
	$blog_id = get_current_blog_id();
	if ( Likes::comment_like_current_user_likes( $blog_id, $comment_id ) ) {
		$classes[] = 'liked';
	}

	return $classes;
}
add_filter( 'comment_class', 'wpcom_comments_add_like_class', 10, 3 );

/**
 * Adds a "Like" action to comment rows.
 *
 * @param array      $actions Array of actions for the comment.
 * @param WP_Comment $comment The comment object.
 * @return array Modified actions array.
 */
function wpcom_comments_enable_likes( $actions, $comment ) {
	$actions['like'] = sprintf(
		'<button class="button-link" data-comment-id="%d" aria-label="%s">%s</button>',
		$comment->comment_ID,
		esc_attr__( 'Like this comment' ),
		esc_html__( 'Like' )
	);

	$actions['unlike'] = sprintf(
		'<button class="button-link" data-comment-id="%d" aria-label="%s">%s</button>',
		$comment->comment_ID,
		esc_attr__( 'Unlike this comment liked by you' ),
		esc_html__( 'Liked by you' )
	);

	return $actions;
}
add_filter( 'comment_row_actions', 'wpcom_comments_enable_likes', 10, 2 );

/**
 * Enqueues the comment like JavaScript in the admin area.
 *
 * The script is only enqueued on the "Edit Comments" screen.
 *
 * @param string $hook The current admin page.
 */
function wpcom_enqueue_comment_like_script( $hook ) {
	// Only run on the edit-comments screen.
	if ( 'edit-comments.php' !== $hook ) {
		return;
	}

	// Enqueue the script.
	jetpack_mu_wpcom_enqueue_assets( 'wpcom-comment-like', array( 'js', 'css' ) );

	// Localize the script with necessary data.
	wp_localize_script(
		'jetpack-mu-wpcom-wpcom-comment-like',
		'wpcomCommentLikesData',
		array(
			'post_like_error' => __( 'Something went wrong when attempting to like that comment. Please try again.' ),
			'post_unlike_error' => __( 'Something went wrong when attempting to unlike that comment. Please try again.' ),
		)
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_comment_like_script', 10, 2 );
